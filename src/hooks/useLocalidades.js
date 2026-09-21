import { useEffect, useState } from 'react';

// Estados e cidades do IBGE (mesma fonte em todo o site). Os estados são
// buscados uma vez só e guardados no módulo; as cidades, por estado.
let cacheEstados = null;
const cacheCidades = new Map();

export function useLocalidades(uf) {
  const [estados, setEstados] = useState(cacheEstados || []);
  const [cidadesPorUf, setCidadesPorUf] = useState({});

  useEffect(() => {
    if (cacheEstados) return undefined;
    let ativo = true;
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((r) => r.json())
      .then((dados) => { cacheEstados = dados; if (ativo) setEstados(dados); })
      .catch(() => {}); // sem IBGE o formulário continua: o servidor valida a sigla
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (!uf || cacheCidades.has(uf)) return undefined;
    let ativo = true;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((dados) => { cacheCidades.set(uf, dados); if (ativo) setCidadesPorUf((c) => ({ ...c, [uf]: dados })); })
      .catch(() => {});
    return () => { ativo = false; };
  }, [uf]);

  const cidades = uf ? (cacheCidades.get(uf) || cidadesPorUf[uf] || []) : [];
  return { estados, cidades, carregandoCidades: Boolean(uf) && !cacheCidades.has(uf) && !cidadesPorUf[uf] };
}
