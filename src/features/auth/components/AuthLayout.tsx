import { type ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps){
    return(
        <div className="auth-shell">
            <div className="auth-shell__background"/>
            <div className="auth-shell__content">{ children }</div>
        </div>
    );
}

/*Generación de fondo en general para el login o auth */ 