import type { ReactNode } from "react";
import { Panel } from "../../../shared/components/ui/Panel";

interface AuthCardProps{
    title: string;
    subtitle: string;
    children: ReactNode;
}

export function AuthCard ({title, subtitle, children}: AuthCardProps){
    return(
        <Panel>
            <div className="auth-card">
                <div className="auth-card__brand">UMG ++</div>
                <h1 className="auth-card__title">{title}</h1>
                <p className="auth-card__subtitle">{subtitle}</p>
                {children}
            </div>
        </Panel>
    )
}