import { useState, useEffect } from "react";

function App() {
  const [numeros, setNumeros] = useState(["", ""]); // mínimo 2
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);

  // --- filtros ---
  const [operationFilter, setOperationFilter] = useState("all"); // all|sum|sub|mul|div
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date | result
  const [order, setOrder] = useState("desc"); // desc | asc
  const [limit, setLimit] = useState(10);

  // --- inputs dinámicos ---
  const agregarNumero = () => setNumeros([...numeros, ""]);
  const eliminarNumero = (index) => {
    if (numeros.length > 2) {
      setNumeros(numeros.filter((_, i) => i !== index));
    }
  };
  const actualizarNumero = (index, value) => {
    const nuevos = [...numeros];
    nuevos[index] = value;
    setNumeros(nuevos);
  };

  // --- operación ---
  const hacerOperacion = async (tipo) => {
    const nums = numeros.map((n) => Number(n));
    if (nums.some((v) => isNaN(v))) {
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
        const errorData = await res.json().catch(() => ({}));
        const message = errorData?.detail?.error || JSON.stringify(errorData) || "Error";
        alert(`Error: ${message}`);
        return;
      }

      const data = await res.json();
      setResultado(data.result);
      obtenerHistorial(); // refrescar historial con filtros actuales
    } catch (err) {
      console.error(err);
      alert("Error al conectar con el servidor");
    }
  };

  // Construir URL de historial con filtros
  const buildHistoryUrl = () => {
    const params = new URLSearchParams();
    params.append("limit", String(limit));
    if (operationFilter !== "all") params.append("operation", operationFilter);
    if (dateFrom) params.append("date_from", dateFrom);
    if (dateTo) params.append("date_to", dateTo);
    if (sortBy) params.append("sort_by", sortBy);
    if (order) params.append("order", order);
    return `/calculator/history?${params.toString()}`;
  };

  // Obtener historial (usa filtros actuales)
  const obtenerHistorial = async () => {
    try {
      const url = `http://localhost:8089${buildHistoryUrl()}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error("Error al obtener historial", res.status);
        return;
      }
      const data = await res.json();
      setHistorial(data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    obtenerHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltros = () => {
    obtenerHistorial();
  };

  const limpiarFiltros = () => {
    setOperationFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortBy("date");
    setOrder("desc");
    setLimit(10);
    // luego fetch
    setTimeout(() => obtenerHistorial(), 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-6">
      <div className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-lg p-6">
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
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-max"
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

        {/* --- FILTROS HISTORIAL --- */}
        <div className="mt-8 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Filtros de historial</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300">Operación</label>
              <select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
              >
                <option value="all">Todas</option>
                <option value="sum">SUM</option>
                <option value="sub">SUB</option>
                <option value="mul">MUL</option>
                <option value="div">DIV</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Fecha de ejecución</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
              />
            </div>

            

            <div>
              <label className="text-sm text-gray-300">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
              >
                <option value="date">Fecha</option>
                <option value="result">Resultado</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-300">Orden</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded bg-gray-800 border border-gray-700"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={aplicarFiltros}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Aplicar filtros
            </button>
            <button
              onClick={limpiarFiltros}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Historial */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Historial:</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {historial.length === 0 && (
              <li className="text-gray-400 text-sm">No hay registros</li>
            )}
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
                <span className="text-gray-400 text-xs">
                  {op.date ? new Date(op.date).toLocaleString() : "?"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
