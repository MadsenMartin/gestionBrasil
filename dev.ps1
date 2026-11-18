# Levanta backend (Django) y frontend (Vite) en la misma consola, cada línea
# con su prefijo de color. Ctrl+C corta los dos; si uno se cae, corta el otro.
#
#   .\dev.ps1

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$subs = [System.Collections.Generic.List[object]]::new()

# Job object con KILL_ON_JOB_CLOSE: si esta consola muere sin pasar por el
# finally (p. ej. al cerrar VS Code), Windows cierra el handle del job y mata
# todo lo que haya adentro. Los nietos (node, autoreloader) heredan el job.
if (-not ('DevJob' -as [type])) {
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class DevJob {
    [StructLayout(LayoutKind.Sequential)]
    struct BASIC { public long a, b; public uint LimitFlags; public UIntPtr c, d; public uint e; public UIntPtr f; public uint g, h; }
    [StructLayout(LayoutKind.Sequential)]
    struct IO { public ulong a, b, c, d, e, f; }
    [StructLayout(LayoutKind.Sequential)]
    struct EXTENDED { public BASIC Basic; public IO Io; public UIntPtr i, j, k, l; }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr CreateJobObject(IntPtr a, string n);
    [DllImport("kernel32.dll")] static extern bool SetInformationJobObject(IntPtr j, int c, ref EXTENDED i, uint l);
    [DllImport("kernel32.dll")] static extern bool AssignProcessToJobObject(IntPtr j, IntPtr p);

    static IntPtr job = IntPtr.Zero;

    public static void Add(IntPtr proceso) {
        if (job == IntPtr.Zero) {
            job = CreateJobObject(IntPtr.Zero, null);
            var info = new EXTENDED();
            info.Basic.LimitFlags = 0x2000; // JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
            SetInformationJobObject(job, 9, ref info, (uint)Marshal.SizeOf(typeof(EXTENDED)));
        }
        AssignProcessToJobObject(job, proceso);
    }
}
'@
}

# Si quedó algo escuchando de una corrida anterior, avisar en vez de que Vite
# se corra a otro puerto en silencio
foreach ($puerto in 8000, 5173) {
    $c = Get-NetTCPConnection -State Listen -LocalPort $puerto -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) {
        Write-Host "Puerto $puerto ocupado por PID $($c.OwningProcess); matándolo (huérfano de otra corrida)" -ForegroundColor Yellow
        taskkill /T /F /PID $c.OwningProcess *> $null
    }
}

function Start-Servicio {
    param([string]$Nombre, [string]$Dir, [string]$Comando, [ConsoleColor]$Color)

    # Pasa por cmd.exe para que resuelva npm.cmd / python del PATH
    $psi = [System.Diagnostics.ProcessStartInfo]::new('cmd.exe', "/c $Comando")
    $psi.WorkingDirectory = Join-Path $root $Dir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    # Sin esto Python bufferea la salida al no tener una terminal
    $psi.EnvironmentVariables['PYTHONUNBUFFERED'] = '1'
    $psi.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'
    # Vite apaga los colores cuando la salida está redirigida
    $psi.EnvironmentVariables['FORCE_COLOR'] = '1'

    $proc = [System.Diagnostics.Process]::new()
    $proc.StartInfo = $psi

    $data = @{ Prefijo = "[$Nombre]".PadRight(8); Color = $Color }
    $accion = {
        if ($null -ne $EventArgs.Data) {
            Write-Host $Event.MessageData.Prefijo -ForegroundColor $Event.MessageData.Color -NoNewline
            Write-Host $EventArgs.Data
        }
    }
    $subs.Add((Register-ObjectEvent $proc OutputDataReceived -Action $accion -MessageData $data))
    $subs.Add((Register-ObjectEvent $proc ErrorDataReceived -Action $accion -MessageData $data))

    [void]$proc.Start()
    [DevJob]::Add($proc.Handle)
    $proc.BeginOutputReadLine()
    $proc.BeginErrorReadLine()
    $proc
}

# Usa el python del .venv de la raíz si existe, así no hace falta activarlo
$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) { $python = 'python' }

$procs = @(
    Start-Servicio -Nombre 'back' -Dir 'Backend' -Comando "`"$python`" manage.py runserver 0.0.0.0:8000" -Color Cyan
    Start-Servicio -Nombre 'front' -Dir 'Frontend' -Comando 'npm run dev' -Color Magenta
)

# El job no alcanza para Django: el python.exe del venv es un launcher que mete
# al intérprete en su propio job con SILENT_BREAKAWAY, y el hijo que lanza el
# autoreloader se escapa del nuestro. Este vigía, fuera del job, espera a que
# muera esta consola y mata lo que siga escuchando en los puertos.
$vigia = Start-Process pwsh -WindowStyle Hidden -PassThru -ArgumentList '-NoProfile', '-Command', @"
Wait-Process -Id $PID -ErrorAction SilentlyContinue
Get-NetTCPConnection -State Listen -LocalPort 8000, 5173 -ErrorAction SilentlyContinue |
    ForEach-Object { taskkill /T /F /PID `$_.OwningProcess *> `$null }
"@

try {
    while (-not ($procs | Where-Object HasExited)) {
        Start-Sleep -Milliseconds 200
    }
    $caido = $procs | Where-Object HasExited | Select-Object -First 1
    Start-Sleep -Milliseconds 500  # deja salir las últimas líneas del que se cayó
    Write-Host "`nUn proceso terminó (exit $($caido.ExitCode)); cortando el otro..." -ForegroundColor Yellow
}
finally {
    # /T mata el árbol: el autoreloader de Django y el node de Vite son hijos de cmd.exe
    foreach ($p in $procs) {
        if (-not $p.HasExited) { taskkill /T /F /PID $p.Id *> $null }
    }
    # Salida normal: el vigía ya no hace falta, y si quedara vivo mataría los
    # servidores de una corrida posterior en esta misma terminal
    Stop-Process -Id $vigia.Id -Force -ErrorAction SilentlyContinue
    foreach ($s in $subs) { Unregister-Event -SourceIdentifier $s.Name -ErrorAction SilentlyContinue }
    Write-Host 'Listo.' -ForegroundColor Yellow
}
