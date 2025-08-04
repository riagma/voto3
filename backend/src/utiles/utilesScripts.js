import { createInterface } from 'readline';

export async function preguntarUsuario(pregunta) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolver => {
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolver(respuesta.toLowerCase().startsWith('s'));
        });
    });
}

