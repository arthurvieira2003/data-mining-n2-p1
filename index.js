const { exec } = require("child_process");
const fs = require("fs");

console.log("=====================================================");
console.log("Análise de Dados - Aeroporto SFO 2018");
console.log("=====================================================");
console.log("Este script executa três análises diferentes:");
console.log("1. Análise de Clustering (Anomalias/Outliers)");
console.log("2. Regras de Associação (FP-Growth)");
console.log("3. Regressão Logística");
console.log("=====================================================\n");

// Função para executar um script com uma promessa
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\nExecutando ${scriptPath}...\n`);

    const process = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar ${scriptPath}: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr de ${scriptPath}: ${stderr}`);
      }

      console.log(stdout);
      resolve(stdout);
    });
  });
}

// Gerar um relatório HTML com os resultados
function generateHTMLReport() {
  let clusteringResults = {};
  let associationRulesResults = {};
  let logisticRegressionResults = {};

  // Carregar resultados se existirem
  try {
    if (fs.existsSync("clustering_results.json")) {
      clusteringResults = JSON.parse(
        fs.readFileSync("clustering_results.json", "utf8")
      );
    }

    if (fs.existsSync("association_rules_results.json")) {
      associationRulesResults = JSON.parse(
        fs.readFileSync("association_rules_results.json", "utf8")
      );
    }

    if (fs.existsSync("logistic_regression_results.json")) {
      logisticRegressionResults = JSON.parse(
        fs.readFileSync("logistic_regression_results.json", "utf8")
      );
    }
  } catch (error) {
    console.error("Erro ao carregar resultados:", error);
  }

  // Gerar HTML
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resultados da Análise de Dados - Aeroporto SFO</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            h1, h2, h3 {
                color: #0066cc;
            }
            .section {
                margin-bottom: 30px;
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #0066cc;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .code {
                background-color: #f4f4f4;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                overflow-x: auto;
            }
        </style>
    </head>
    <body>
        <h1>Resultados da Análise de Dados - Aeroporto SFO</h1>
        
        <!-- Análise de Clustering -->
        <div class="section">
            <h2>1. Análise de Clustering (Anomalias/Outliers)</h2>
            ${
              Object.keys(clusteringResults).length > 0
                ? `
                <h3>Principais Resultados</h3>
                <p>Identificamos um grupo incomum de passageiros que corresponde a 
                   ${
                     clusteringResults.analysis?.smallestClusterPercentage ||
                     "N/A"
                   }% 
                   do total de passageiros do aeroporto.</p>
                   
                <h3>Perfil do Cluster Anômalo</h3>
                <table>
                    <tr>
                        <th>Característica</th>
                        <th>Valor Médio</th>
                    </tr>
                    ${Object.entries(
                      clusteringResults.analysis?.anomalyProfile || {}
                    )
                      .map(
                        ([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                    `
                      )
                      .join("")}
                </table>
                
                <h3>Distribuição dos Clusters</h3>
                <table>
                    <tr>
                        <th>Cluster</th>
                        <th>Percentual de Passageiros</th>
                    </tr>
                    ${Object.entries(
                      clusteringResults.analysis?.percentages || {}
                    )
                      .map(
                        ([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${value}%</td>
                    </tr>
                    `
                      )
                      .join("")}
                </table>
                `
                : "<p>Análise de clustering não foi executada ou não gerou resultados.</p>"
            }
        </div>
        
        <!-- Regras de Associação -->
        <div class="section">
            <h2>2. Regras de Associação (FP-Growth)</h2>
            ${
              Object.keys(associationRulesResults).length > 0
                ? `
                <h3>Principais Regras Encontradas</h3>
                <p>Foram encontradas ${
                  associationRulesResults.rules?.length || 0
                } regras de associação 
                   com suporte mínimo de ${
                     associationRulesResults.parameters?.minSupport * 100 ||
                     "N/A"
                   }% 
                   e confiança mínima de ${
                     associationRulesResults.parameters?.minConfidence * 100 ||
                     "N/A"
                   }%.</p>
                   
                <h3>Top 5 Regras por Confiança</h3>
                <table>
                    <tr>
                        <th>Antecedente</th>
                        <th>Consequente</th>
                        <th>Suporte (%)</th>
                        <th>Confiança (%)</th>
                        <th>Lift</th>
                    </tr>
                    ${(associationRulesResults.rules || [])
                      .slice(0, 5)
                      .map(
                        (rule, index) => `
                    <tr>
                        <td>${rule.antecedent.join(" E ")}</td>
                        <td>${rule.consequent.join(" E ")}</td>
                        <td>${(rule.support * 100).toFixed(2)}</td>
                        <td>${(rule.confidence * 100).toFixed(2)}</td>
                        <td>${rule.lift.toFixed(2)}</td>
                    </tr>
                    `
                      )
                      .join("")}
                </table>
                `
                : "<p>Análise de regras de associação não foi executada ou não gerou resultados.</p>"
            }
        </div>
        
        <!-- Regressão Logística -->
        <div class="section">
            <h2>3. Regressão Logística</h2>
            ${
              Object.keys(logisticRegressionResults).length > 0
                ? `
                <h3>Resultados do Modelo</h3>
                <p>Treinamos um modelo de regressão logística para prever a satisfação dos passageiros.</p>
                
                <h4>Métricas de Desempenho</h4>
                <table>
                    <tr>
                        <th>Métrica</th>
                        <th>Valor (%)</th>
                    </tr>
                    <tr>
                        <td>Acurácia</td>
                        <td>${(
                          logisticRegressionResults.evaluation?.accuracy * 100
                        ).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Precisão</td>
                        <td>${(
                          logisticRegressionResults.evaluation?.precision * 100
                        ).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Recall</td>
                        <td>${(
                          logisticRegressionResults.evaluation?.recall * 100
                        ).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>F1-Score</td>
                        <td>${(
                          logisticRegressionResults.evaluation?.f1Score * 100
                        ).toFixed(2)}</td>
                    </tr>
                </table>
                
                <h4>Importância das Características</h4>
                <table>
                    <tr>
                        <th>Característica</th>
                        <th>Peso</th>
                    </tr>
                    ${(logisticRegressionResults.model?.features || [])
                      .map(
                        (feature, index) => `
                    <tr>
                        <td>${feature}</td>
                        <td>${logisticRegressionResults.model?.weights[
                          index
                        ].toFixed(4)}</td>
                    </tr>
                    `
                      )
                      .join("")}
                </table>
                `
                : "<p>Análise de regressão logística não foi executada ou não gerou resultados.</p>"
            }
        </div>
        
        <div class="section">
            <h2>Conclusões Gerais</h2>
            <p>Com base nas análises realizadas, podemos concluir que:</p>
            <ul>
                <li>Existe um grupo distinto de passageiros que representa 
                   ${
                     clusteringResults.analysis?.smallestClusterPercentage ||
                     "N/A"
                   }% 
                   do total, com características diferentes do perfil típico.</li>
                <li>Identificamos padrões de associação entre diferentes características 
                   e comportamentos dos passageiros no aeroporto.</li>
                <li>É possível prever a satisfação dos passageiros com uma acurácia de 
                   ${
                     (
                       logisticRegressionResults.evaluation?.accuracy * 100
                     ).toFixed(2) || "N/A"
                   }% 
                   utilizando características demográficas.</li>
            </ul>
        </div>
        
        <footer>
            <p>Gerado em ${new Date().toLocaleString("pt-BR")}</p>
        </footer>
    </body>
    </html>
    `;

  fs.writeFileSync("resultados.html", html, "utf8");
  console.log("\nRelatório HTML gerado: resultados.html");
}

// Função principal para executar todas as análises
async function runAllAnalyses() {
  try {
    // 1. Análise de Clustering
    await runScript("clustering_analysis.js");

    // 2. Regras de Associação
    await runScript("association_rules.js");

    // 3. Regressão Logística
    await runScript("logistic_regression.js");

    console.log("\n=====================================================");
    console.log("Todas as análises foram concluídas com sucesso!");
    console.log("=====================================================");

    // Gerar relatório HTML
    generateHTMLReport();

    console.log(
      "\nPara visualizar os resultados detalhados, abra os seguintes arquivos:"
    );
    console.log(
      "1. clustering_results.json - Resultados da análise de clustering"
    );
    console.log(
      "2. association_rules_results.json - Regras de associação encontradas"
    );
    console.log(
      "3. logistic_regression_results.json - Resultados do modelo de regressão logística"
    );
    console.log("4. resultados.html - Relatório HTML com todos os resultados");
  } catch (error) {
    console.error("Erro ao executar as análises:", error);
  }
}

// Executar todas as análises
runAllAnalyses();
