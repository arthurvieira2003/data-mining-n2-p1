const XLSX = require("xlsx");
const fs = require("fs");

// Implementação simplificada do algoritmo FP-Growth para regras de associação
class FPGrowth {
  constructor(minSupport = 0.01, minConfidence = 0.5) {
    this.minSupport = minSupport;
    this.minConfidence = minConfidence;
    this.itemsets = [];
    this.frequentItemsets = [];
    this.rules = [];
  }

  // Etapa 1: Encontrar itens frequentes
  findFrequentItems(transactions) {
    // Contagem de frequência de cada item
    const itemFrequency = {};

    transactions.forEach((transaction) => {
      transaction.forEach((item) => {
        itemFrequency[item] = (itemFrequency[item] || 0) + 1;
      });
    });

    // Filtrar itens com suporte mínimo
    const n = transactions.length;
    const frequentItems = {};

    Object.keys(itemFrequency).forEach((item) => {
      const support = itemFrequency[item] / n;
      if (support >= this.minSupport) {
        frequentItems[item] = {
          count: itemFrequency[item],
          support: support,
        };
      }
    });

    return frequentItems;
  }

  // Etapa 2: Gerar candidatos e frequentes itemsets (versão simplificada)
  generateFrequentItemsets(transactions, frequentItems) {
    const n = transactions.length;
    const frequentPatterns = [];

    // Gerar itemsets de tamanho 1
    Object.keys(frequentItems).forEach((item) => {
      frequentPatterns.push({
        items: [item],
        support: frequentItems[item].support,
        count: frequentItems[item].count,
      });
    });

    // Gerar itemsets de tamanho 2
    for (let i = 0; i < Object.keys(frequentItems).length; i++) {
      const item1 = Object.keys(frequentItems)[i];

      for (let j = i + 1; j < Object.keys(frequentItems).length; j++) {
        const item2 = Object.keys(frequentItems)[j];
        const itemset = [item1, item2];

        // Contar ocorrências do par
        let count = 0;
        transactions.forEach((transaction) => {
          if (transaction.includes(item1) && transaction.includes(item2)) {
            count++;
          }
        });

        const support = count / n;
        if (support >= this.minSupport) {
          frequentPatterns.push({
            items: itemset,
            support: support,
            count: count,
          });
        }
      }
    }

    // Gerar itemsets de tamanho 3
    const frequentPairs = frequentPatterns.filter(
      (pattern) => pattern.items.length === 2
    );

    for (let i = 0; i < frequentPairs.length; i++) {
      const pair = frequentPairs[i].items;

      for (let j = 0; j < Object.keys(frequentItems).length; j++) {
        const item = Object.keys(frequentItems)[j];

        // Verificar se o item já está no par
        if (pair.includes(item)) {
          continue;
        }

        const itemset = [...pair, item];

        // Contar ocorrências do trio
        let count = 0;
        transactions.forEach((transaction) => {
          if (itemset.every((item) => transaction.includes(item))) {
            count++;
          }
        });

        const support = count / n;
        if (support >= this.minSupport) {
          frequentPatterns.push({
            items: itemset,
            support: support,
            count: count,
          });
        }
      }
    }

    return frequentPatterns;
  }

  // Etapa 3: Geração de regras de associação (versão simplificada)
  generateRules(frequentItemsets) {
    const rules = [];

    frequentItemsets.forEach((itemset) => {
      if (itemset.items.length < 2) return; // Precisa de pelo menos 2 itens

      // Para cada item no itemset, gerar uma regra onde esse item é o consequente
      itemset.items.forEach((consequentItem) => {
        // Antecedente é o conjunto sem o item consequente
        const antecedent = itemset.items.filter(
          (item) => item !== consequentItem
        );

        // Encontrar o suporte do antecedente
        let antecedentSupport = 0;
        for (const candidate of frequentItemsets) {
          if (this.arraysEqual(candidate.items, antecedent)) {
            antecedentSupport = candidate.support;
            break;
          }
        }

        // Calcular a confiança
        const confidence = itemset.support / antecedentSupport;

        // Adicionar a regra se a confiança for suficiente
        if (confidence >= this.minConfidence) {
          // Encontrar o suporte do consequente
          let consequentSupport = 0;
          for (const candidate of frequentItemsets) {
            if (
              candidate.items.length === 1 &&
              candidate.items[0] === consequentItem
            ) {
              consequentSupport = candidate.support;
              break;
            }
          }

          // Calcular o lift
          const lift = confidence / consequentSupport;

          rules.push({
            antecedent: antecedent,
            consequent: [consequentItem],
            support: itemset.support,
            confidence: confidence,
            lift: lift,
          });
        }
      });
    });

    return rules;
  }

  // Função auxiliar para comparar arrays
  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  // Função principal para executar o algoritmo
  fit(transactions) {
    console.log(
      `Executando FP-Growth com ${transactions.length} transações...`
    );

    // Etapa 1: Encontrar itens frequentes
    const frequentItems = this.findFrequentItems(transactions);
    console.log(
      `Encontrados ${
        Object.keys(frequentItems).length
      } itens frequentes com suporte mínimo ${this.minSupport}`
    );

    // Etapa 2: Gerar itemsets frequentes
    this.frequentItemsets = this.generateFrequentItemsets(
      transactions,
      frequentItems
    );
    console.log(`Gerados ${this.frequentItemsets.length} itemsets frequentes`);

    // Etapa 3: Gerar regras de associação
    this.rules = this.generateRules(this.frequentItemsets);
    console.log(
      `Geradas ${this.rules.length} regras de associação com confiança mínima ${this.minConfidence}`
    );

    // Ordenar regras por confiança
    this.rules.sort((a, b) => b.confidence - a.confidence);

    return this;
  }
}

// Carregar o arquivo XLSX
console.log("Carregando o dataset...");
const workbook = XLSX.readFile("sfo 2018_data file_final_Weightedv2.xlsx");
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(worksheet);
console.log(`Dataset carregado com ${data.length} registros.`);

// Função para transformar os dados para o formato de transações para regras de associação
function prepareTransactionData() {
  // Vamos criar transações baseadas em características dos passageiros do aeroporto
  // Por exemplo, vamos considerar os serviços que cada passageiro utilizou no aeroporto

  // Verificar as colunas disponíveis
  console.log("Colunas disponíveis no dataset:");
  console.log(Object.keys(data[0]).slice(0, 10) + "...");

  // Vamos usar as colunas relacionadas a serviços do aeroporto
  // Assumindo que existem colunas que indicam quais serviços cada passageiro utilizou
  const serviceColumns = Object.keys(data[0]).filter(
    (col) =>
      col.startsWith("Q7") || // Suposição: colunas Q7 representam serviços utilizados
      col.startsWith("Q8") || // Suposição: colunas Q8 representam áreas visitadas
      col.startsWith("Q11") // Suposição: colunas Q11 representam experiências
  );

  console.log(
    `Identificadas ${serviceColumns.length} colunas de serviços/áreas/experiências`
  );

  // Transformar em transações
  const transactions = [];

  data.forEach((record) => {
    const transaction = [];

    // Para cada coluna de serviço, verificar se o passageiro utilizou (valor > 0)
    serviceColumns.forEach((column) => {
      const value = parseInt(record[column]);
      if (!isNaN(value) && value > 0) {
        transaction.push(column);
      }
    });

    // Adicionar outros atributos relevantes em formato discretizado

    // Idade (discretizada)
    if (record.Q20Age) {
      const age = parseInt(record.Q20Age);
      if (!isNaN(age)) {
        if (age < 25) transaction.push("Idade_Jovem");
        else if (age < 45) transaction.push("Idade_Adulto");
        else transaction.push("Idade_Senior");
      }
    }

    // Gênero
    if (record.Q21Gender) {
      transaction.push(`Genero_${record.Q21Gender}`);
    }

    // Renda
    if (record.Q22Income) {
      const income = parseInt(record.Q22Income);
      if (!isNaN(income)) {
        if (income < 50000) transaction.push("Renda_Baixa");
        else if (income < 100000) transaction.push("Renda_Media");
        else transaction.push("Renda_Alta");
      }
    }

    // Frequência de voos
    if (record.Q23FLY) {
      const frequency = parseInt(record.Q23FLY);
      if (!isNaN(frequency)) {
        if (frequency <= 2) transaction.push("Voa_Raramente");
        else if (frequency <= 6) transaction.push("Voa_Ocasionalmente");
        else transaction.push("Voa_Frequentemente");
      }
    }

    // Satisfação
    if (record.NETPRO) {
      const satisfaction = parseInt(record.NETPRO);
      if (!isNaN(satisfaction)) {
        if (satisfaction < 0) transaction.push("Insatisfeito");
        else if (satisfaction > 0) transaction.push("Satisfeito");
        else transaction.push("Neutro");
      }
    }

    // Adicionar a transação se não estiver vazia
    if (transaction.length > 0) {
      transactions.push(transaction);
    }
  });

  console.log(
    `Geradas ${transactions.length} transações para análise de regras de associação`
  );

  return transactions;
}

// Executar a análise de regras de associação
function runAssociationRulesAnalysis() {
  // Preparar os dados em formato de transações
  const transactions = prepareTransactionData();

  // Definir parâmetros para o algoritmo FP-Growth
  const minSupport = 0.05; // Suporte mínimo (5% das transações)
  const minConfidence = 0.3; // Confiança mínima (30%)

  // Executar o algoritmo FP-Growth
  const fpGrowth = new FPGrowth(minSupport, minConfidence);
  fpGrowth.fit(transactions);

  // Extrair as regras encontradas
  const rules = fpGrowth.rules;

  // Imprimir as regras mais relevantes
  console.log("\nTop 10 regras de associação encontradas:");
  rules.slice(0, 10).forEach((rule, index) => {
    console.log(`Regra ${index + 1}:`);
    console.log(
      `  SE ${rule.antecedent.join(" E ")} ENTÃO ${rule.consequent.join(" E ")}`
    );
    console.log(`  Suporte: ${(rule.support * 100).toFixed(2)}%`);
    console.log(`  Confiança: ${(rule.confidence * 100).toFixed(2)}%`);
    console.log(`  Lift: ${rule.lift.toFixed(2)}`);
    console.log();
  });

  // Salvar as regras em um arquivo JSON
  fs.writeFileSync(
    "association_rules_results.json",
    JSON.stringify(
      {
        parameters: {
          minSupport,
          minConfidence,
        },
        rules: rules,
      },
      null,
      2
    )
  );

  console.log(`Resultados salvos em association_rules_results.json`);

  return rules;
}

// Problema: Identificar padrões de comportamento e preferências de passageiros do aeroporto de SFO
// Objetivo: Descobrir quais características e serviços estão associados entre si

console.log(
  "Análise de Regras de Associação - Perfis de Passageiros do Aeroporto SFO"
);
console.log(
  "==================================================================="
);
console.log(
  "Problema: Identificar padrões de comportamento e preferências de passageiros"
);
console.log("Dados: sfo 2018_data file_final_Weightedv2.xlsx");
console.log("Algoritmo: FP-Growth (alternativa ao Apriori)");
console.log(
  "===================================================================\n"
);

// Executar a análise
runAssociationRulesAnalysis();
