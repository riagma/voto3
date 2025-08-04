import { desencriptarJSON } from "../src/utiles/utilesCrypto.js";
import { CLAVE_PRUEBAS } from "../src/utiles/constantes.js";
// genera-auth-basic.js
// const [,, datosPrivados, password] = process.argv;

const datosPrivados = 'N84z344pi/HqatDN8aOgbN4ggkEN2gnG1FJk99WUwAEsHsGKHznqDzhPRMy1y9i/QJXrteuWINFe0woDTHvQ8te3Nj+VdsE9l6ldNYYnuxIgfeZDbtUxO+bdOKgiKDZHuQ75iT/OmroVeOvBu6pXxDv0GDn0IhOttSu7mzHWk6qyD0cLlIFJ7BSFRQJv4nJ3BRYTeaERqJqtLOHyKRRIOxUISgnJZsb63NAPKY8Ib1ubvXhEdnVM93g5OkxVwn/GMpaVa2UuGg38+2BqZf+C+i5LgEaPzsVhsrBLWH5MAr0HbyJP1YuQHUMbnX6ByG/l6soJPedSHIUTfq9Mh10GIyALAfnjk81cntLaHYqV2/pS9JF3WwujXVwcTmnhE+zIRPM6JZlfxbfyz02iQGAeoCTu9O2nlNxnbDE6oVAOxp2MymMfVU3XdDSYeUR47mb9P2wATD/rELQ1Xpb8GjNzNRR1r0fV0nF2J5M3M6yLsXF4NcWddSujC7GQ8lL9+pSoJJIk3iZLj3pQGqEeqcwgKbi/Vf1l4zLHoMu+keVAvnaDFAm3+HynrJuc/VMen+ErrSi4IA=='

if (!datosPrivados) {
  console.error('Uso: node node ${process.argv[1]} <datosPrivados> <password>');
  process.exit(1);
}

const datosPrivadosDesencriptados = await desencriptarJSON(datosPrivados, CLAVE_PRUEBAS);

console.log('Datos Privados:', datosPrivadosDesencriptados);