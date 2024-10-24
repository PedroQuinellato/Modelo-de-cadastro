import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const API_URL = 'http://localhost:3000';

const BusManagement = () => {
  const [linhas, setLinhas] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [activeTab, setActiveTab] = useState('cadastroLinhas');

  // Buscar dados iniciais
  useEffect(() => {
    fetchLinhas();
    fetchPontos();
  }, []);

  // Funções para buscar dados
  const fetchLinhas = async () => {
    try {
      const response = await fetch(`${API_URL}/linhas`);
      const data = await response.json();
      setLinhas(data);
    } catch (error) {
      console.error('Erro ao buscar linhas:', error);
    }
  };

  const fetchPontos = async () => {
    try {
      const response = await fetch(`${API_URL}/pontos`);
      const data = await response.json();
      setPontos(data);
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
    }
  };

  // Componente de Cadastro de Linhas
  const CadastroLinhas = () => {
    const [numero, setNumero] = useState('');
    const [tipo, setTipo] = useState('Comum');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_URL}/linhas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numero, tipo })
        });

        if (response.ok) {
          alert('Linha cadastrada com sucesso!');
          setNumero('');
          setTipo('Comum');
          fetchLinhas(); // Atualiza a lista de linhas
        }
      } catch (error) {
        console.error('Erro ao cadastrar linha:', error);
        alert('Erro ao cadastrar linha');
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Cadastro de Linhas</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Número da Linha:</label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Tipo de Ônibus:</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="Comum">Comum</option>
              <option value="Executivo">Executivo</option>
              <option value="Articulado">Articulado</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Cadastrar Linha
          </button>
        </form>
      </div>
    );
  };

  // Componente de Cadastro de Pontos
  const CadastroPontos = () => {
    const [linha, setLinha] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(`${API_URL}/pontos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            linha,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
          })
        });

        if (response.ok) {
          alert('Ponto cadastrado com sucesso!');
          setLatitude('');
          setLongitude('');
          fetchPontos(); // Atualiza a lista de pontos
        }
      } catch (error) {
        console.error('Erro ao cadastrar ponto:', error);
        alert('Erro ao cadastrar ponto');
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Cadastro de Pontos</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Selecione a Linha:</label>
            <select
              value={linha}
              onChange={(e) => setLinha(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Selecione uma linha</option>
              {linhas.map((l) => (
                <option key={l.id} value={l.numero}>
                  {l.numero} - {l.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Latitude:</label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-2">Longitude:</label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Cadastrar Ponto
          </button>
        </form>
      </div>
    );
  };

  // Visualização dos dados cadastrados
  const Visualizacao = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Linhas Cadastradas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {linhas.map((linha) => (
            <Card key={linha.id}>
              <CardContent className="p-4">
                <p className="font-bold">Linha: {linha.numero}</p>
                <p>Tipo: {linha.tipo}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-2">Pontos Cadastrados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pontos.map((ponto) => (
            <Card key={ponto.id}>
              <CardContent className="p-4">
                <p className="font-bold">Linha: {ponto.linha}</p>
                <p>Latitude: {ponto.latitude}</p>
                <p>Longitude: {ponto.longitude}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Ônibus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab('cadastroLinhas')}
              className={`px-4 py-2 rounded ${
                activeTab === 'cadastroLinhas'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              Cadastro de Linhas
            </button>
            <button
              onClick={() => setActiveTab('cadastroPontos')}
              className={`px-4 py-2 rounded ${
                activeTab === 'cadastroPontos'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              Cadastro de Pontos
            </button>
            <button
              onClick={() => setActiveTab('visualizacao')}
              className={`px-4 py-2 rounded ${
                activeTab === 'visualizacao'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              Visualização
            </button>
          </div>

          {activeTab === 'cadastroLinhas' && <CadastroLinhas />}
          {activeTab === 'cadastroPontos' && <CadastroPontos />}
          {activeTab === 'visualizacao' && <Visualizacao />}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusManagement;