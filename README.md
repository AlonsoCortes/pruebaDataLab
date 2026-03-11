# Prueba Técnica — Análisis de Mercado CDMX

## Descripción

Este repositorio contiene los archivos elaborados como parte de una prueba técnica cuyo para identificar dos sitios optimos el establecimiento de heladerías en la ciudad de México, para este ejercicio se utilizaron las colonias como unidad de analisis territorial.

El análisis integra fuentes de datos abiertos — DENUE, Censo de Población y Vivienda 2020 e información de colonias de la CDMX — para caracterizar la demanda potencial mediante segmentación poblacional y evaluar la oferta existente a través de la densidad de competidores por unidad territorial.

---

## Contenido del repositorio



`nb_01_heladerias.ipynb`  Notebook con el procesamiento de datos: carga, limpieza, clustering KMeans y selección de colonias candidatas <br>
`index.html` Visor geográfico interactivo con el ranking de colonias mejor punteadas como sitios de expansión<br>
`colonias_interes_heladerias.geojson` Capa geoespacial con las colonias de la CDMX y sus atributos de análisis <br>
`presentacion_ejercicio1.pdf` Presentación ejecutiva de 5 diapositivas con los resultados y conclusiones del análisis <br>

---

## Metodología general

1. **Fuentes de datos:** DENUE (INEGI, 2026), Censo de Población y Vivienda 2020 a nivel manzana, colonias CDMX 2023.
2. **Caracterización de la demanda:** Agrupamiento de colonias por perfil etario mediante el algoritmo KMeans (4 clusters).
3. **Evaluación de la oferta:** Cálculo de densidad de heladerías existentes y poblacional por hectárea.
4. **Selección de candidatas:** Filtrado por cluster de interés, alta densidad poblacional y baja competencia relativa.
5. **Propuesta final:** Las dos colonias con mayor puntaje combinado son presentadas con su justificación territorial.

---

## Herramientas utilizadas

- Python 3.12 — `geopandas`, `pandas`, `scikit-learn`, `matplotlib`
- Jupyter Notebook
- QGIS / Folium para visualización geoespacial

---