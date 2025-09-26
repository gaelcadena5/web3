import { useState, useEffect } from "react";
import "./index.css";

function App() {
  const [numbers, setNumbers] = useState(["", ""]); // mínimo 2 números
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);

  // Manejar cambio en inputs
  const handleNumberChange = (index, value) => {
    const newNumbers = [...numbers];
    newNumbers[index] = value;
    setNumbers(newNumbers);
  };

  // Agregar un nuevo input
  const addInput = () => {
    setNumbers([...numbers, ""]);
  };

  // Eliminar el último input (mínimo 2)
  const removeInput = () => {
    if (numbers.length > 2) {
      setNumbers(numbers.slice(0, -1));
    }
  };

  // Llamar a la API
  const calcular = async (op) => {
    const query = numbers.map((n) => `numbers=${n}`).join("&");
    try {
      const res = await fetch(`http://localhost:8089/calculator/${op}?${query}`);
      if (!res.ok) {
        console.error("Error en cálculo:", res.status);
        setResultado("Error en la operación");
        return;
      }
      const data = await res.json();
      setResultado(data.result);
      obtenerHistorial();
    } catch (err) {
      console.error("Error de red:", err);
      setResultado("Error de conexión");
    }
  };

  // Obtener historial
  const obtenerHistorial = async () => {
    try {
      const res = await fetch("http://localhost:8089/calculator/history");
      if (!res.ok) {
        console.error("Error al obtener historial:", res.status);
        setHistorial([]);
        return;
      }
      const data = await res.json();
      setHistorial(data.history || []);
    } catch (err) {
      console.error("Error de red:", err);
      setHistorial([]);
    }
  };

  useEffect(() => {
    obtenerHistorial();
  }, [resultado]);

  return (
    <div className="container">
      <div className="calculator">
        <h1>Calculadora</h1>

        {/* Inputs dinámicos */}
        {numbers.map((num, i) => (
          <input
            key={i}
            type="number"
            value={num}
            onChange={(e) => handleNumberChange(i, e.target.value)}
            placeholder={`Número ${i + 1}`}
          />
        ))}

        {/* Botones para manejar inputs */}
        <div className="input-buttons">
          <button className="add-input" onClick={addInput}>
            + Agregar número
          </button>
          <button
            className="remove-input"
            onClick={removeInput}
            disabled={numbers.length <= 2}
          >
            - Eliminar número
          </button>
        </div>

        {/* Botones de operaciones */}
        <button className="sum" onClick={() => calcular("sum")}>
          Sumar
        </button>
        <button className="sub" onClick={() => calcular("sub")}>
          Restar
        </button>
        <button className="mul" onClick={() => calcular("mul")}>
          Multiplicar
        </button>
        <button className="div" onClick={() => calcular("div")}>
          Dividir
        </button>

        {/* Resultado */}
        {resultado !== null && (
          <div className="resultado">Resultado: {resultado}</div>
        )}

        {/* Historial */}
        <div className="historial">
          <h3>Historial:</h3>
          <ul>
            {historial.length > 0 ? (
              historial.map((op, i) => (
                <li key={i}>
                  {op.operation}({op.numbers.join(", ")}) ={" "}
                  <strong>{op.result}</strong>{" "}
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>
                    ({op.date})
                  </span>
                </li>
              ))
            ) : (
              <li>No hay historial</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
