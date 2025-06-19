// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const protegerRuta = (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
        try {
            // Obtener el token de la cabecera (formato: "Bearer TOKEN")
            token = authHeader.split(' ')[1];

            console.log(`[MIDDLEWARE] Verificando con JWT_SECRET: ${process.env.JWT_SECRET}`);
            
            // Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRETO_POR_DEFECTO_PARA_DESARROLLO');
            
            // Adjuntar el ID del usuario al objeto request para usarlo en los controladores
            req.usuarioId = decoded.id;

            next(); // Continuar a la siguiente función/controlador
        } catch (error) {
            res.status(401).json({ message: 'Token no válido o expirado.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se encontró un token.' });
    }
};