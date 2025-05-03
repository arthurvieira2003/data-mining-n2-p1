# Análise de Dados - Aeroporto SFO 2018

Este projeto realiza análises avançadas sobre o dataset do aeroporto SFO de 2018, incluindo:

1. **Análise de Clustering/Anomalias**: Identifica grupos incomuns de passageiros que não se enquadram no perfil típico de cliente do aeroporto.
2. **Regras de Associação**: Utiliza o algoritmo FP-Growth para descobrir padrões e relações entre diferentes características dos passageiros.
3. **Regressão Logística**: Implementa um modelo para prever a satisfação dos passageiros com base em características demográficas.

## Requisitos

- Node.js (versão 12.x ou superior)
- NPM (gerenciador de pacotes do Node.js)

## Instalação

Clone este repositório e instale as dependências:

```bash
git clone [url-do-repositorio]
cd [nome-da-pasta]
npm install
```

## Como executar

Para executar todas as análises de uma vez:

```bash
node index.js
```

Para executar análises específicas:

```bash
node clustering_analysis.js    # Apenas análise de clustering
node association_rules.js      # Apenas regras de associação
node logistic_regression.js    # Apenas regressão logística
```

## Resultados

Após a execução, os seguintes arquivos serão gerados:

- `clustering_results.json`: Resultados da análise de clustering
- `association_rules_results.json`: Regras de associação encontradas
- `logistic_regression_results.json`: Resultados do modelo de regressão logística
- `resultados.html`: Relatório HTML com todos os resultados visualizados de forma intuitiva

## Estrutura do Projeto

- `index.js`: Script principal que executa todas as análises
- `clustering_analysis.js`: Implementação da análise de clustering (K-means)
- `association_rules.js`: Implementação do algoritmo FP-Growth para regras de associação
- `logistic_regression.js`: Implementação da regressão logística
- `sfo 2018_data file_final_Weightedv2.xlsx`: Dataset utilizado nas análises

## Metodologia

### 1. Análise de Clustering

- Utiliza o algoritmo K-means para agrupar passageiros com base em características demográficas e comportamentais
- Identifica grupos atípicos analisando tamanho e características dos clusters
- Variáveis utilizadas: NETPRO, Q20Age, Q21Gender, Q22Income, Q23FLY, Q5TIMESFLOW, Q6LONGUSE

### 2. Regras de Associação

- Implementa o algoritmo FP-Growth (alternativa ao Apriori)
- Transforma dados demográficos e de comportamento em formato transacional
- Identifica regras com alta confiança e suporte significativo

### 3. Regressão Logística

- Prevê satisfação dos passageiros (NETPRO > 0)
- Implementa algoritmo de gradiente descendente para otimização
- Avalia o modelo com métricas de acurácia, precisão, recall e F1-score

## Autores

- Arthur Henrique Tscha Vieira
- Rafael Rodrigues Ferreira de Andrade
