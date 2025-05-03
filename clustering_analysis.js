const XLSX = require("xlsx");
const fs = require("fs");

// Carregar o arquivo XLSX
console.log("Carregando o dataset...");
const workbook = XLSX.readFile("sfo 2018_data file_final_Weightedv2.xlsx");
const sheetName = workbook.SheetNames[0]; // Assumindo que os dados estão na primeira planilha
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`Dataset carregado com ${data.length} registros.`);

// Implementação simples do algoritmo K-means para clustering
function KMeansImpl(dataset, k, maxIterations = 100) {
  // Verificar se temos dados suficientes
  if (dataset.length < k) {
    throw new Error("Não há dados suficientes para criar " + k + " clusters");
  }

  // Função para calcular a distância euclidiana entre dois pontos
  function euclideanDistance(point1, point2) {
    return Math.sqrt(
      point1.reduce((sum, value, i) => sum + Math.pow(value - point2[i], 2), 0)
    );
  }

  // Inicializar centroides aleatoriamente
  function initializeCentroids() {
    const centroids = [];
    const usedIndices = new Set();

    while (centroids.length < k) {
      const randomIndex = Math.floor(Math.random() * dataset.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        centroids.push([...dataset[randomIndex]]);
      }
    }

    return centroids;
  }

  // Atribuir cada ponto ao centroide mais próximo
  function assignClusters(centroids) {
    const clusters = new Array(dataset.length).fill(0);

    dataset.forEach((point, i) => {
      let minDistance = Infinity;
      let clusterIndex = 0;

      centroids.forEach((centroid, j) => {
        const distance = euclideanDistance(point, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          clusterIndex = j;
        }
      });

      clusters[i] = clusterIndex;
    });

    return clusters;
  }

  // Recalcular centroides com base nos pontos atribuídos
  function updateCentroids(clusters) {
    const newCentroids = new Array(k)
      .fill(0)
      .map(() => new Array(dataset[0].length).fill(0));
    const counts = new Array(k).fill(0);

    dataset.forEach((point, i) => {
      const cluster = clusters[i];
      counts[cluster]++;

      point.forEach((value, j) => {
        newCentroids[cluster][j] += value;
      });
    });

    // Calcular média para cada centroide
    newCentroids.forEach((centroid, i) => {
      if (counts[i] > 0) {
        centroid.forEach((sum, j) => {
          centroid[j] = sum / counts[i];
        });
      }
    });

    return newCentroids;
  }

  // Verificar se os centroides convergiram
  function hasConverged(oldCentroids, newCentroids, threshold = 0.001) {
    return oldCentroids.every((oldCentroid, i) => {
      return euclideanDistance(oldCentroid, newCentroids[i]) < threshold;
    });
  }

  // Implementação principal do K-means
  let centroids = initializeCentroids();
  let clusters = [];
  let iterations = 0;
  let converged = false;

  while (!converged && iterations < maxIterations) {
    clusters = assignClusters(centroids);
    const newCentroids = updateCentroids(clusters);

    converged = hasConverged(centroids, newCentroids);
    centroids = newCentroids;
    iterations++;
  }

  return {
    clusters,
    centroids,
    iterations,
  };
}

// Função para normalizar dados
function normalizeData(data, features) {
  const normalizedData = [];

  // Calcular mínimo e máximo para cada feature
  const mins = {};
  const maxs = {};

  features.forEach((feature) => {
    mins[feature] = Math.min(
      ...data.map((item) => parseFloat(item[feature] || 0))
    );
    maxs[feature] = Math.max(
      ...data.map((item) => parseFloat(item[feature] || 0))
    );
  });

  // Normalizar os dados
  data.forEach((item) => {
    const normalizedItem = [];
    features.forEach((feature) => {
      const value = parseFloat(item[feature] || 0);
      const normalizedValue =
        (value - mins[feature]) / (maxs[feature] - mins[feature]);
      normalizedItem.push(normalizedValue);
    });
    normalizedData.push(normalizedItem);
  });

  return normalizedData;
}

// Preparar os dados para clustering
function prepareData() {
  // Verificar quais são as colunas disponíveis no dataset
  console.log("Verificando as colunas disponíveis...");
  const sampleRecord = data[0];
  console.log("Colunas disponíveis:", Object.keys(sampleRecord));

  // Encontrar a coluna NETPRO (pode ter espaços extras)
  const netproColumn = Object.keys(sampleRecord).find(
    (key) => key.trim() === "NETPRO" || key.includes("NETPRO")
  );

  // Escolher as colunas corretas com base nas informações disponíveis
  const features = [
    netproColumn,
    "Q20Age",
    "Q21Gender",
    "Q22Income",
    "Q23FLY",
    "Q5TIMESFLOWN",
    "Q6LONGUSE",
  ];

  // Verificar quais features realmente existem no dataset
  const availableFeatures = features.filter(
    (feature) => feature in sampleRecord
  );
  console.log("Features disponíveis para análise:", availableFeatures);

  // Normalizar os dados para as features disponíveis
  return normalizeData(data, availableFeatures);
}

// Executar o algoritmo K-means para diferentes números de clusters
function findOptimalClusters(dataset, maxClusters = 10) {
  const results = [];

  for (let k = 2; k <= maxClusters; k++) {
    // Usar nossa implementação de K-means
    const kmeans = KMeansImpl(dataset, k);
    results.push({
      k: k,
      clusters: kmeans.clusters,
      centroids: kmeans.centroids,
      // A métrica de erro interno (como SSE - Sum of Squared Errors)
      error: kmeans.centroids.reduce((acc, centroid, i) => {
        const clusterPoints = dataset.filter(
          (_, idx) => kmeans.clusters[idx] === i
        );
        const error = clusterPoints.reduce((sum, point) => {
          return (
            sum +
            point.reduce((dist, val, j) => {
              return dist + Math.pow(val - centroid[j], 2);
            }, 0)
          );
        }, 0);
        return acc + error;
      }, 0),
    });
  }

  return results;
}

// Analisar os clusters obtidos
function analyzeClusters(dataset, clusterResults, k) {
  // Usar nossa implementação de K-means
  const kmeans = KMeansImpl(dataset, k);
  const clusters = kmeans.clusters;

  // Contar o número de pontos em cada cluster
  const clusterSizes = {};
  clusters.forEach((cluster) => {
    clusterSizes[cluster] = (clusterSizes[cluster] || 0) + 1;
  });

  // Calcular a porcentagem de cada cluster
  const percentages = {};
  Object.keys(clusterSizes).forEach((cluster) => {
    percentages[cluster] = (
      (clusterSizes[cluster] / clusters.length) *
      100
    ).toFixed(2);
  });

  // Identificar o menor cluster (potencial anomalia)
  const smallestCluster = Object.keys(clusterSizes).reduce((a, b) =>
    clusterSizes[a] < clusterSizes[b] ? a : b
  );

  console.log(`\nAnálise para k=${k}:`);
  console.log(`Número de passageiros em cada cluster:`, clusterSizes);
  console.log(`Percentagem de passageiros em cada cluster:`, percentages);
  console.log(
    `Cluster potencialmente anômalo: ${smallestCluster} (${percentages[smallestCluster]}% dos passageiros)`
  );

  // Analisar o perfil do cluster anômalo
  const anomalyIndices = clusters
    .map((cluster, idx) => (cluster === parseInt(smallestCluster) ? idx : -1))
    .filter((idx) => idx !== -1);

  // Obter os registros originais correspondentes ao cluster anômalo
  const anomalyProfiles = anomalyIndices.map((idx) => data[idx]);

  // Encontrar a coluna NETPRO (pode ter espaços extras)
  const netproColumn = Object.keys(data[0]).find(
    (key) => key.trim() === "NETPRO" || key.includes("NETPRO")
  );

  // Calcular médias/moda das características do cluster anômalo
  const features = [
    netproColumn,
    "Q20Age",
    "Q21Gender",
    "Q22Income",
    "Q23FLY",
    "Q5TIMESFLOWN",
    "Q6LONGUSE",
  ];
  const profileSummary = {};

  features.forEach((feature) => {
    if (feature in data[0]) {
      // Calcular a média para características numéricas
      const values = anomalyProfiles
        .map((profile) => parseFloat(profile[feature]))
        .filter((val) => !isNaN(val));

      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        profileSummary[feature] = avg.toFixed(2);
      } else {
        profileSummary[feature] = "N/A";
      }
    } else {
      profileSummary[feature] = "Não disponível";
    }
  });

  console.log(`\nPerfil do cluster anômalo (médias/valores típicos):`);
  console.table(profileSummary);

  return {
    clusterSizes,
    percentages,
    smallestClusterPercentage: percentages[smallestCluster],
    anomalyProfile: profileSummary,
  };
}

// Função principal de execução
async function main() {
  try {
    // Preparar dados
    const dataset = prepareData();
    console.log(`Dados normalizados para ${dataset.length} registros.`);

    // Encontrar número ótimo de clusters
    console.log("Procurando o número ótimo de clusters...");
    const clusterResults = findOptimalClusters(dataset);

    // Elbow method - encontrar o ponto de inflexão
    console.log("Resultados de erro para diferentes números de clusters:");
    clusterResults.forEach((result) => {
      console.log(`k=${result.k}, Erro=${result.error}`);
    });

    // Analisar os clusters com k=4 (ajuste conforme necessário após visualizar o gráfico)
    const k = 4; // Ajuste este valor com base na análise do "elbow method"
    const analysisResults = analyzeClusters(dataset, clusterResults, k);

    // Salvar os resultados em um arquivo JSON
    fs.writeFileSync(
      "clustering_results.json",
      JSON.stringify(
        {
          clusterResults: clusterResults,
          analysis: analysisResults,
        },
        null,
        2
      )
    );

    console.log("\nResultados salvos em clustering_results.json");
  } catch (error) {
    console.error("Erro na análise de clustering:", error);
  }
}

// Executar o programa
main();
