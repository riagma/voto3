use poseidon::poseidon2;

// fn main(inputs: [Field; 4], len: u32) -> pub Field {
//     let hash = if len == 1 {
//         poseidon2::Poseidon2::hash(inputs, 1)
//     } else if len == 2 {
//         poseidon2::Poseidon2::hash(inputs, 2)
//     } else if len == 3 {
//         poseidon2::Poseidon2::hash(inputs, 3)
//     } else {
//         poseidon2::Poseidon2::hash(inputs, 4)
//     };
//     hash
// }

// // Ejemplo de test
// #[test]
// fn test_poseidon2_hash_array() {
//     let arr: [Field; 4] = [1, 2, 3, 4];
//     let hash_1 = main(arr, 1); // Hash de [1]
//     let hash_2 = main(arr, 2); // Hash de [1, 2]
//     let hash_3 = main(arr, 3); // Hash de [1, 2, 3]
//     let hash_4 = main(arr, 4); // Hash de [1, 2, 3, 4]
//     assert(hash_1 != hash_2);
//     assert(hash_2 != hash_3);
//     assert(hash_3 != hash_4);
// }

fn main(clave1: Field, clave2: Field) -> pub Field {
    if clave2 == 0 {
      poseidon2::Poseidon2::hash([clave1], 1)
     } else {
      poseidon2::Poseidon2::hash([clave1, clave2], 2)
   }
}

#[test]
fn test_poseidon2_main() {
    // Caso 1: Solo clave1 (clave2 = 0)
    let clave1: Field = 123;
    let clave2: Field = 0;
    let hash1 = main(clave1, clave2);
    let esperado1 = poseidon2::Poseidon2::hash([clave1], 1);
    assert(hash1 == esperado1);

    // Caso 2: clave1 y clave2 distintos de 0
    let clave1b: Field = 123;
    let clave2b: Field = 456;
    let hash2 = main(clave1b, clave2b);
    let esperado2 = poseidon2::Poseidon2::hash([clave1b, clave2b], 2);
    assert(hash2 == esperado2);

    // Los hashes deben ser diferentes
    assert(hash1 != hash2);
}

