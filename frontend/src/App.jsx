import { useState, useEffect } from "react";

function App() {
    const [numeros, setNumeros] = useState(["", ""]); // mínimo 2
    const [resultado, setResultado] = useState(null);
    const [historial, setHistorial] = useState([]);

    // Agregar un número
    const agregarNumero = () => {
        setNumeros([...numeros, ""]);
    };

    // Eliminar un número (mínimo 2)
    const eliminarNumero = (index) => {
        if (numeros.length > 2) {
            setNumeros(numeros.filter((_, i) => i !== index));
        }
    };

    // Manejo de cambios en inputs
    const actualizarNumero = (index, value) => {
        const nuevos = [...numeros];
        nuevos[index] = value;
        setNumeros(nuevos);
    };

    // Hacer operación
    const hacerOperacion = async (tipo) => {
        const nums = numeros.map((n) => Number(n));
        if (nums.some(isNaN)) {
            alert("Todos los campos deben ser números válidos");
            return;
        }

        try {
            const res = await fetch(`http://localhost:8089/calculator/${tipo}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numbers: nums }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(`Error: ${errorData.detail.error}`);
                return;
            }

            const data = await res.json();
            setResultado(data.result);
            obtenerHistorial();
        } catch (err) {
            console.error(err);
            alert("Error al conectar con el servidor");
        }
    };

    // Obtener historial
    const obtenerHistorial = async () => {
        const res = await fetch("http://localhost:8089/calculator/history?limit=10");
        const data = await res.json();
        setHistorial(data.history);
    };

    useEffect(() => {
        obtenerHistorial();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-6">
            <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg p-6">
                <h1 className="text-3xl font-bold text-center text-blue-400 mb-6">
                    Calculadora Avanzada
                </h1>

                {/* Inputs dinámicos */}
                <div className="flex flex-col space-y-4">
                    {numeros.map((num, i) => (
                        <div key={i} className="flex space-x-2 items-center">
                            <input
                                type="number"
                                value={num}
                                onChange={(e) => actualizarNumero(i, e.target.value)}
                                placeholder={`Número ${i + 1}`}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {numeros.length > 2 && (
                                <button
                                    onClick={() => eliminarNumero(i)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={agregarNumero}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                        Agregar número
                    </button>
                </div>

                {/* Botones de operaciones */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button
                        onClick={() => hacerOperacion("sum")}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                    >
                        Sumar
                    </button>
                    <button
                        onClick={() => hacerOperacion("sub")}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                    >
                        Restar
                    </button>
                    <button
                        onClick={() => hacerOperacion("mul")}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                    >
                        Multiplicar
                    </button>
                    <button
                        onClick={() => hacerOperacion("div")}
                        className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                    >
                        Dividir
                    </button>
                </div>

                {/* Resultado */}
                {resultado !== null && (
                    <h2 className="mt-6 text-xl font-semibold text-green-400 text-center">
                        Resultado: {resultado}
                    </h2>
                )}

                {/* Historial */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-300 mb-3">
                        Historial:
                    </h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {historial.map((op, i) => (
                            <li
                                key={i}
                                className="bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 text-sm"
                            >
                                <span className="text-blue-400 font-bold">
                                    {op.operation ? op.operation.toUpperCase() : "?"}
                                </span>{" "}
                                ({op.numbers?.join(", ") ?? "?"}) ={" "}
                                <span className="text-green-400 font-bold">{op.result}</span>{" "}
                                <span className="text-gray-400 text-xs">({op.date})</span>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}

export default App;
