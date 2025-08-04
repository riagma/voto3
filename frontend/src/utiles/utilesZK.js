
// import { compile, createFileManager } from "@noir-lang/noir_wasm";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

// import initNoirC from "@noir-lang/noirc_abi";
// import initACVM from "@noir-lang/acvm_js";
// import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
// import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";
// await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);

// let noirPromesa = null;
// let noirIniciado = false;

// async function inicializarNoir() {
//   if (noirIniciado) return true; 
//   if (noirPromesa) return noirPromesa;
  
//   noirPromesa = (async () => {
//     try {
//       // Usar la inicialización estándar recomendada en la documentación de Noir
//       await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);
//       console.log("Módulos WASM inicializados correctamente");
//       noirIniciado = true;
//       return true;
//     } catch (error) {
//       console.error("Error inicializando módulos WASM:", error);
//       return false;
//     }
//   })();
  
//   return noirPromesa;
// }

// import main from "./merkle11/src/main.nr?url";
// import nargoToml from "./merkle11/Nargo.toml?url";

// export async function getCircuit() {
// 	const fm = createFileManager("/");
// 	const { body } = await fetch(main);
// 	const { body: nargoTomlBody } = await fetch(nargoToml);

// 	fm.writeFile("./src/main.nr", body);
// 	fm.writeFile("./Nargo.toml", nargoTomlBody);
// 	return await compile(fm);
// }
// const show = (id, content) => {
// 	const container = document.getElementById(id);
// 	container.appendChild(document.createTextNode(content));
// 	container.appendChild(document.createElement("br"));
// };

// // document.getElementById("submit").addEventListener("click", async () => {
// export async function getProof() {
// 	try {
// 		// noir goes here
// const { program } = await getCircuit();
// const noir = new Noir(program);
// const backend = new UltraHonkBackend(program.bytecode);
// const age = document.getElementById("age").value;
// show("logs", "Generating witness... ⏳");
// const { witness } = await noir.execute({ age });
// show("logs", "Generated witness... ✅");
// show("logs", "Generating proof... ⏳");
// const proof = await backend.generateProof(witness);
// show("logs", "Generated proof... ✅");
// show("results", proof.proof);
// show("logs", "Verifying proof... ⌛");
// const isValid = await backend.verifyProof(proof);
// show("logs", `Proof is ${isValid ? "valid" : "invalid"}... ✅`);
// 	} catch (err) {
// 		console.error(err);
// 		show("logs", "Oh 💔");
// 	}
// }

export async function diagnosticarCircuito(url) {
  try {
    console.log(`Cargando circuito desde ${url}...`);
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error(`Error al cargar ${url}: ${respuesta.status} ${respuesta.statusText}`);
    }
    
    const circuito = await respuesta.json();
    console.log("Circuito cargado:", Object.keys(circuito));
    
    return circuito;
  } catch (err) {
    console.error("Error cargando circuito:", err);
    throw err;
  }
}

export async function generarPrueba(circuito, inputs) {
  try {
    console.log("Creando instancia de Noir");
    const noir = new Noir(circuito);
    
    console.log("Creando instancia de UltraHonkBackend");
    const honk = new UltraHonkBackend(circuito.bytecode, { threads: 1 });
    
    console.log("Ejecutando circuito con inputs:", inputs);
    const { witness } = await noir.execute(inputs);
    
    console.log("Generando prueba");
    const respHonk = await honk.generateProof(witness);
    console.log("Prueba generada:");
    
    return respHonk;
    
  } catch (err) {
    console.error("Error generando prueba:", err);
    throw err;
  }
}


export async function testCircuito() {
  try {
    console.log("Cargando circuito Merkle11...");
    const respuesta = await fetch('/circuits/E-001/merkle11.json');
    if (!respuesta.ok) throw new Error('No se pudo cargar el JSON');
    const merkle11 = await respuesta.json();
    console.log(merkle11);
    const noir = new Noir(merkle11);
    const honk = new UltraHonkBackend(merkle11.bytecode);

  } catch (err) {
    console.error(err);
    console.log("Oh 💔");
  }
}

// });
