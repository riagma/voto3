
import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

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
    console.error("Stack trace:", err.stack);
    
    // Log adicional para debugging
    if (inputs) {
      console.error("Inputs originales que causaron el error:", JSON.stringify(inputs, null, 2));
    }
    
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
