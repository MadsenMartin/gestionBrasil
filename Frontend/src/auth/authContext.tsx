import { get_user_data } from "@/endpoints/api";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Interfaces
interface UserInfo {
  id: number;
  username: string;
  groups: string[];
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  hasGroup: (groupName: string) => boolean;
  isAdmin: () => boolean;
  isTesoreria: () => boolean;
  isGeneral: () => boolean;
  isRecepcion: () => boolean;
}

// Crear el contexto con un valor inicial
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

// Componente proveedor
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para verificar pertenencia a un grupo
  const hasGroup = (groupName: string) => {
    return user?.groups.includes(groupName) || false;
  };

  // Funciones para verificar roles específicos
  const isAdmin = () => {
    return hasGroup('Administración - 1') || user?.is_staff || user?.is_superuser || false;
  };

  const isTesoreria = () => {
    return hasGroup('Administración - 2');
  };

  const isGeneral = () => {
    return hasGroup('Administración - 3');
  };

  const isRecepcion = () => {
    return hasGroup('Administración - 4');
  };

  // Efecto para cargar la información del usuario al montar el componente
  useEffect(() => {
    const fetchUserInfo = async () => {
      
      try {
        const response = await get_user_data();
        setUser(response);
        setError(null);
      } catch (err) {
        console.error('Error al obtener información del usuario:', err);
        setError('No se pudo cargar la información del usuario');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Proporcionar el contexto a los componentes hijos
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      hasGroup,
      isAdmin,
      isTesoreria,
      isGeneral,
      isRecepcion,
    }}>
      {children}
    </AuthContext.Provider>
  );
};