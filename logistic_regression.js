const XLSX = require("xlsx");
const fs = require("fs");

// Implementação de Regressão Logística
class LogisticRegression {
  constructor(options = {}) {
    this.learningRate = options.learningRate || 0.1;
    this.iterations = options.iterations || 1000;
    this.weights = null;
    this.bias = 0;
    this.costs = [];
  }

  // Função sigmoide - transforma valores em probabilidades entre 0 e 1
  sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
  }

  // Treina o modelo com dados de entrada X e rótulos y
  fit(X, y) {
    const m = X.length; // Número de exemplos
    const n = X[0].length; // Número de características

    // Inicializar pesos e bias
    this.weights = Array(n).fill(0);
    this.bias = 0;

    // Otimização de gradiente descendente
    for (let i = 0; i < this.iterations; i++) {
      const predictions = this.predict_proba(X);

      // Calcular gradientes
      const dw = Array(n).fill(0);
      let db = 0;

      for (let j = 0; j < m; j++) {
        const error = predictions[j] - y[j];

        // Atualizar gradientes
        for (let k = 0; k < n; k++) {
          dw[k] += error * X[j][k];
        }
        db += error;
      }

      // Atualizar pesos e bias
      for (let k = 0; k < n; k++) {
        this.weights[k] -= (this.learningRate * dw[k]) / m;
      }
      this.bias -= (this.learningRate * db) / m;

      // Calcular e armazenar o custo
      if (i % 100 === 0) {
        const cost = this.computeCost(X, y);
        this.costs.push({ iteration: i, cost });
        console.log(`Iteração ${i}: Custo = ${cost.toFixed(4)}`);
      }
    }

    return this;
  }

  // Calcula o custo (log loss)
  computeCost(X, y) {
    const m = X.length;
    const predictions = this.predict_proba(X);
    let cost = 0;

    for (let i = 0; i < m; i++) {
      cost +=
        y[i] * Math.log(predictions[i] + 1e-10) +
        (1 - y[i]) * Math.log(1 - predictions[i] + 1e-10);
    }

    return -cost / m;
  }

  // Faz previsões (probabilidades)
  predict_proba(X) {
    return X.map((x) => {
      let z = this.bias;
      for (let i = 0; i < x.length; i++) {
        z += x[i] * this.weights[i];
      }
      return this.sigmoid(z);
    });
  }

  // Faz previsões (classes)
  predict(X, threshold = 0.5) {
    const probas = this.predict_proba(X);
    return probas.map((p) => (p >= threshold ? 1 : 0));
  }

  // Avalia o modelo
  evaluate(X, y) {
    const predictions = this.predict(X);
    let correct = 0;

    for (let i = 0; i < y.length; i++) {
      if (predictions[i] === y[i]) {
        correct++;
      }
    }

    const accuracy = correct / y.length;

    // Calcular precisão, recall, F1-score
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < y.length; i++) {
      if (predictions[i] === 1 && y[i] === 1) {
        truePositives++;
      } else if (predictions[i] === 1 && y[i] === 0) {
        falsePositives++;
      } else if (predictions[i] === 0 && y[i] === 1) {
        falseNegatives++;
      }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = (2 * precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
    };
  }
}

// Função para dividir os dados em conjuntos de treinamento e teste
function trainTestSplit(X, y, testSize = 0.2, randomSeed = 42) {
  // Implementação simples de semente aleatória
  const random = (seed) => {
    let m_w = seed;
    let m_z = 987654321;
    const mask = 0xffffffff;

    return () => {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
      let result = ((m_z << 16) + m_w) & mask;
      result /= 4294967296;
      return result + 0.5;
    };
  };

  const rand = random(randomSeed);

  // Criar índices aleatórios para dividir os dados
  const indices = Array.from({ length: X.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testSize_absolute = Math.floor(X.length * testSize);
  const testIndices = indices.slice(0, testSize_absolute);
  const trainIndices = indices.slice(testSize_absolute);

  // Dividir X e y
  const X_train = trainIndices.map((i) => X[i]);
  const X_test = testIndices.map((i) => X[i]);
  const y_train = trainIndices.map((i) => y[i]);
  const y_test = testIndices.map((i) => y[i]);

  return { X_train, X_test, y_train, y_test };
}

// Carregar o arquivo XLSX
console.log("Carregando o dataset...");
const workbook = XLSX.readFile("sfo 2018_data file_final_Weightedv2.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`Dataset carregado com ${data.length} registros.`);

// Problema: Prever se um passageiro está satisfeito com o aeroporto
// Vamos usar uma abordagem de regressão logística para prever se o NETPRO > 0 (satisfeito) ou não
function runLogisticRegressionAnalysis() {
  console.log("Preparando os dados para Regressão Logística...");

  // Verificar as colunas disponíveis
  console.log("Amostra de colunas disponíveis:");
  console.log(Object.keys(data[0]).slice(0, 10) + "...");

  // Encontrar o nome correto da coluna NETPRO (pode ter espaços extras)
  const netproColumn = Object.keys(data[0]).find(
    (key) => key.trim() === "NETPRO" || key.includes("NETPRO")
  );

  if (!netproColumn) {
    console.error("Coluna NETPRO não encontrada no dataset!");
    return;
  }

  console.log(`Coluna NETPRO encontrada como: '${netproColumn}'`);

  // Definir variáveis independentes (X) e dependente (y)
  const features = [
    "Q20Age", // Idade
    "Q21Gender", // Gênero (vamos converter para numérico)
    "Q22Income", // Renda
    "Q23FLY", // Frequência de voos
    "Q5TIMESFLOW", // Experiência de voos
    "Q6LONGUSE", // Há quanto tempo voam pelo aeroporto
  ];

  // Verificar quais features existem no dataset
  const availableFeatures = features.filter((feature) => feature in data[0]);
  console.log("Features disponíveis para o modelo:", availableFeatures);

  // Preparar os dados para o modelo
  const processedData = data.filter(
    (record) =>
      // Garantir que NETPRO existe e que todas as features disponíveis têm valores
      netproColumn in record &&
      availableFeatures.every(
        (feature) =>
          feature in record &&
          record[feature] !== null &&
          record[feature] !== undefined
      )
  );

  console.log(`Dataset filtrado: ${processedData.length} registros válidos`);

  // Converter features para formato numérico
  const X = processedData.map((record) => {
    return availableFeatures.map((feature) => {
      if (feature === "Q21Gender") {
        // Converter gênero para numérico (por exemplo, 'Male' = 0, 'Female' = 1)
        return record[feature] === "Female" ? 1 : 0;
      } else {
        return parseFloat(record[feature]) || 0;
      }
    });
  });

  // Definir a variável alvo (y) como 1 se NETPRO > 0 (satisfeito), 0 caso contrário
  const y = processedData.map((record) =>
    parseFloat(record[netproColumn]) > 0 ? 1 : 0
  );

  // Dividir dados em conjuntos de treinamento e teste
  const { X_train, X_test, y_train, y_test } = trainTestSplit(X, y, 0.3);

  console.log(`Conjunto de treinamento: ${X_train.length} exemplos`);
  console.log(`Conjunto de teste: ${X_test.length} exemplos`);

  // Treinar o modelo de Regressão Logística
  console.log("\nTreinando o modelo de Regressão Logística...");
  const logreg = new LogisticRegression({
    learningRate: 0.1,
    iterations: 1000,
  });

  logreg.fit(X_train, y_train);

  // Avaliar o modelo no conjunto de teste
  const evaluation = logreg.evaluate(X_test, y_test);

  console.log("\nResultados da avaliação do modelo:");
  console.log(`Acurácia: ${(evaluation.accuracy * 100).toFixed(2)}%`);
  console.log(`Precisão: ${(evaluation.precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(evaluation.recall * 100).toFixed(2)}%`);
  console.log(`F1-Score: ${(evaluation.f1Score * 100).toFixed(2)}%`);

  // Obter a importância das características
  console.log("\nImportância das características:");
  availableFeatures.forEach((feature, index) => {
    console.log(`${feature}: ${logreg.weights[index].toFixed(4)}`);
  });

  // Salvar os resultados em um arquivo JSON
  const results = {
    model: {
      weights: logreg.weights,
      bias: logreg.bias,
      features: availableFeatures,
    },
    evaluation: {
      accuracy: evaluation.accuracy,
      precision: evaluation.precision,
      recall: evaluation.recall,
      f1Score: evaluation.f1Score,
    },
    trainingProcess: {
      costs: logreg.costs,
    },
  };

  fs.writeFileSync(
    "logistic_regression_results.json",
    JSON.stringify(results, null, 2)
  );
  console.log("\nResultados salvos em logistic_regression_results.json");

  return results;
}

// Problema: Prever a satisfação de passageiros com base em características demográficas
console.log(
  "Análise de Regressão Logística - Previsão de Satisfação de Passageiros"
);
console.log(
  "==================================================================="
);
console.log(
  "Problema: Prever se um passageiro estará satisfeito (NETPRO > 0) com base em características demográficas"
);
console.log("Dados: sfo 2018_data file_final_Weightedv2.xlsx");
console.log("Algoritmo: Regressão Logística (alternativa à Regressão Linear)");
console.log(
  "===================================================================\n"
);

// Executar a análise
runLogisticRegressionAnalysis();
