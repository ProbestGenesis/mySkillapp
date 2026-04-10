import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.ts";


export interface AuthRequest extends Request {
    session?: typeof auth.api.getSession extends () => Promise<infer T> ? T : any;
    user?: any; // You can refine this with your user type
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const headers = fromNodeHeaders(req.headers)
    const session = await auth.api.getSession({ headers })
    if (!session) {
        return res.status(401).json({ error: "Unauthorized" })
    }
    req.session = session;
    req.user = session.user;
    next()
}
