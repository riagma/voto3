use poseidon::poseidon2;

global DEPTH: u32 = 11;

fn main(
    // Entradas privadas
    clave: Field,
    anulador: Field,
    path: [Field; DEPTH],       // Camino de hermanos desde hoja hasta raiz
    idxs: [Field; DEPTH],       // 0 = izquierda, 1 = derecha para cada nivel

    // Entradas publicas
    raiz: pub Field,            // Raiz del arbol Merkle
    anulador_hash: pub Field    // Hash del anulador para evitar doble gasto
) {
    // 1. Calcular la hoja a partir de clave + anulador usando Poseidon2
    let hoja = poseidon2::Poseidon2::hash([clave, anulador], 2);

    // 2. Verificar que el anulador_hash publico corresponde al anulador privado
    let anulador_hash_calculado = poseidon2::Poseidon2::hash([anulador], 1);
    assert(anulador_hash_calculado == anulador_hash);
    
    // 3. Verificar el camino Merkle desde la hoja hasta la raiz
    let mut hash_actual = hoja;

    for i in 0..DEPTH {
        let hermano = path[i];
        let posicion = idxs[i];

        // Si posicion == 0, hash_actual va a la izquierda
        // Si posicion == 1, hash_actual va a la derecha
        let izquierda = if posicion == 0 { hash_actual } else { hermano };
        let derecha = if posicion == 0 { hermano } else { hash_actual };

        hash_actual = poseidon2::Poseidon2::hash([izquierda, derecha], 2);
    }

    // 4. Verificar que llegamos a la raiz esperada
    assert(hash_actual == raiz);
    
}

#[test]
fn test_merkle_proof() {
    let clave = 123;
    let anulador = 456;
    let anulador_hash = poseidon2::Poseidon2::hash([anulador], 1);

    let path: [Field; DEPTH] = [0; DEPTH];
    let idxs: [Field; DEPTH] = [0; DEPTH];

    // Calcula la hoja
    let hoja = poseidon2::Poseidon2::hash([clave, anulador], 2);
    let mut hash_actual = hoja;
    for i in 0..DEPTH {
        let hermano = path[i];
        let posicion = idxs[i];
        let izquierda = if posicion == 0 { hash_actual } else { hermano };
        let derecha = if posicion == 0 { hermano } else { hash_actual };
        hash_actual = poseidon2::Poseidon2::hash([izquierda, derecha], 2);
    }
    let raiz = hash_actual;

    main(clave, anulador, path, idxs, raiz, anulador_hash);
}
