/* ============================================================
   Geospatial Training Tutorials
   content-data.js  ·  THE ONLY FILE YOU EDIT TO CHANGE CONTENT

   The whole site is generated from the tree below. app.js reads
   this object and builds every bubble, tile, and link from it.
   You never need to touch index.html, style.css, or app.js to
   add, remove, or rename content.

   ------------------------------------------------------------
   HOW THE TREE WORKS
   ------------------------------------------------------------
   A node looks like this:

   {
     id:     'py-geocoding',        // required, unique, no spaces
     label:  'Geocoding',           // required, shown on the tile
     blurb:  'One line of context', // optional
     status: 'ready',               // 'ready' or 'soon'
     lesson: 'https://...',         // optional Carpentries page,
                                    // shown as the first chip
     links:  [ ... ],               // optional list of link chips
     children: [ ... ]              // optional list of sub tiles
   }

   A link chip looks like this:

   { label: 'Batch geocoding', kind: 'colab',
     href: 'https://colab.research.google.com/...' }

   kind is one of:
     'lesson'  a Carpentries lesson or episode page
     'colab'   a Google Colab notebook
     'doc'     anything else (reading, dataset, video...)

   ------------------------------------------------------------
   RECIPES
   ------------------------------------------------------------
   ADD A NOTEBOOK to an existing topic:
     find the topic by its label, add one line to its links list:
       { label: 'My new notebook', kind: 'colab', href: 'https://...' }

   ADD A NEW SUB TOPIC (for example under Data Analysis):
     add a node object to that topic's children list. Give it a
     unique id, a label, and its own links. Done.

   ADD A NEW MAIN TOPIC to QGIS or Python:
     add a node object to that route's children list.

   MARK A PLACEHOLDER: give the node  status: 'soon'  and leave
     out href on any chip that is not ready yet:
       { label: 'Notebook coming soon', kind: 'colab' }
     Chips without an href render as a dashed placeholder.

   WHEN CONTENT IS READY: paste the real href into the chip and
     change status to 'ready'. Nothing else to do.

   Deep links: every id works as a URL hash. Sharing
   index.html#py-geocoding opens the tree straight to that node.
   ============================================================ */

window.GEO_TREE = {

    /* ────────────────────────────────────────────────
       THE TWO ROUTES
       ──────────────────────────────────────────────── */
    routes: [

        /* ============ QGIS ============ */
        {
            id: 'qgis',
            label: 'QGIS',
            tagline: 'Desktop route',
            blurb: 'Point and click mapping in free, open source GIS software. No code required.',
            accent: 'qgis',
            children: [

                {
                    id: 'qgis-start',
                    label: 'Getting Started',
                    blurb: 'Install QGIS, meet the interface, make a first map.',
                    status: 'ready',
                    links: [
                        { label: 'Your first map in QGIS', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataVisualization/qgisintro.html' },
                        { label: 'Working and teaching with QGIS', kind: 'lesson',
                          href: 'https://spatialturn.github.io/session1a/' },
                        { label: 'Quantum GIS guide', kind: 'lesson',
                          href: 'https://spatialturn.github.io/intromoduletest/qgisintro.html' },
                        { label: 'Where geospatial data lives', kind: 'lesson',
                          href: 'https://spatialturn.github.io/intromoduletest/platforms.html' }
                    ]
                },

                {
                    id: 'qgis-collection',
                    label: 'Data Collection',
                    blurb: 'Bring vector, raster, and field data into a project.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/DataCollection/',
                    links: [
                        { label: 'U.S. Census Bureau data', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataCollection/census.html' },
                        { label: 'Vector data repositories', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataCollection/imageryvector.html' },
                        { label: 'Imagery databases', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataCollection/imagery.html' },
                        { label: 'Field based collection', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataCollection/field.html' }
                    ]
                },

                {
                    id: 'qgis-carto',
                    label: 'Cartography & Visualization',
                    blurb: 'Design maps that carry a spatial pattern to an audience.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/DataVisualization/',
                    links: [
                        { label: 'Fundamentals of map design', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataVisualization/mapbasics.html' },
                        { label: 'Cartography checklists', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataVisualization/mapvisual.html' },
                        { label: 'Accessibility in map design', kind: 'lesson',
                          href: 'https://spatialturn.github.io/DataVisualization/accessibility.html' }
                    ]
                },

                {
                    id: 'qgis-raster',
                    label: 'Raster & Remote Sensing',
                    blurb: 'Satellite imagery, elevation models, and terrain products.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/session2a/',
                    links: [
                        { label: 'Acquiring raster data', kind: 'lesson',
                          href: 'https://spatialturn.github.io/session2a/acquiring-raster-data.html' },
                        { label: 'DEM analysis and visualization', kind: 'lesson',
                          href: 'https://spatialturn.github.io/session2a/dem-analysis.html' }
                    ]
                },

                {
                    id: 'qgis-cases',
                    label: 'Case Studies',
                    blurb: 'Practical exercises that run a full workflow start to finish.',
                    status: 'ready',
                    children: [
                        {
                            id: 'qgis-case-fooddesert',
                            label: 'Food Desert Mapping',
                            blurb: 'Collect grocery locations in the field, then measure access.',
                            status: 'ready',
                            links: [
                                { label: 'QField: mapping grocery stores', kind: 'lesson',
                                  href: 'https://spatialturn.github.io/DataCollection/qfield.html' },
                                { label: 'Network analysis for grocery access', kind: 'lesson',
                                  href: 'https://spatialturn.github.io/DataCollection/qfield-network.html' }
                            ]
                        },
                        {
                            id: 'qgis-case-satellite',
                            label: 'Satellite Imagery Exercises',
                            blurb: 'Vegetation and flood mapping with Sentinel-2 scenes.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/session3a/',
                            links: [
                                { label: 'NDVI with Sentinel-2', kind: 'lesson',
                                  href: 'https://spatialturn.github.io/session3a/ndvi-analysis.html' },
                                { label: 'Flood mapping with NDWI', kind: 'lesson',
                                  href: 'https://spatialturn.github.io/session3a/flood-analysis.html' }
                            ]
                        },
                        {
                            id: 'qgis-case-more',
                            label: 'More Case Studies',
                            blurb: 'Further applied exercises are being written.',
                            status: 'soon',
                            links: [
                                { label: 'Case study coming soon', kind: 'lesson' }
                            ]
                        }
                    ]
                }
            ]
        },

        /* ============ PYTHON ============ */
        {
            id: 'python',
            label: 'Python',
            tagline: 'Notebook route',
            blurb: 'Code first analysis in Google Colab with pandas, GeoPandas, and friends.',
            accent: 'python',
            children: [

                {
                    id: 'py-intro',
                    label: 'Introduction',
                    blurb: 'Notebook fundamentals and the core geospatial libraries.',
                    status: 'ready',
                    children: [
                        {
                            id: 'py-colab',
                            label: 'Working in Colab',
                            blurb: 'Run Python in the browser, no installation needed.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/intromoduletest/introduction.html',
                            links: [
                                { label: 'Python notebook introduction', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Introduction_Python.ipynb' },
                                { label: 'Variables and data types', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Variables_Intro.ipynb' },
                                { label: 'Beginner practice notebook', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Beginner.ipynb' }
                            ]
                        },
                        {
                            id: 'py-pandas',
                            label: 'Pandas & NumPy',
                            blurb: 'Tables, arrays, and the moves you will use everywhere.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/IGIC2026/prelunch.html',
                            links: [
                                { label: 'NumPy, pandas, GeoPandas walkthrough', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/IGIC2026/blob/main/episodes/intro_python.ipynb' },
                                { label: 'Practice question with answer key', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/IGIC2026/blob/main/episodes/Question1_AnswerKey.ipynb' }
                            ]
                        },
                        {
                            id: 'py-geopandas',
                            label: 'GeoPandas',
                            blurb: 'Vector data as dataframes: points, lines, polygons.',
                            status: 'soon',
                            links: [
                                { label: 'GeoPandas notebook coming soon', kind: 'colab' }
                            ]
                        },
                        {
                            id: 'py-crs',
                            label: 'CRS Conversion',
                            blurb: 'Coordinate reference systems and reprojection.',
                            status: 'soon',
                            links: [
                                { label: 'CRS notebook coming soon', kind: 'colab' }
                            ]
                        },
                        {
                            id: 'py-plotting',
                            label: 'Plotting',
                            blurb: 'First charts and maps with matplotlib.',
                            status: 'ready',
                            links: [
                                { label: 'Introduction to plotting', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Intro_Ploting.ipynb' },
                                { label: 'Styling figures, coming soon', kind: 'colab' }
                            ]
                        }
                    ]
                },

                {
                    id: 'py-collection',
                    label: 'Data Collection',
                    blurb: 'Pull census tables and OpenStreetMap features with code.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/IGIC2026/midlunch.html',
                    links: [
                        { label: 'Census data introduction', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/IGIC2026/blob/main/episodes/CensusDATA_Introduction.ipynb' },
                        { label: 'Census geocode API', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/CensusGeocodeAPI.ipynb' },
                        { label: 'Joining census tables', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/census_join.ipynb' },
                        { label: 'Querying OpenStreetMap', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Census_Geocoding_OSM-Query.ipynb' }
                    ]
                },

                {
                    id: 'py-viz',
                    label: 'Visualization',
                    blurb: 'From honest charts to publication ready figures.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/DataVisualization/introduction.html',
                    links: [
                        { label: 'Good and bad plotting', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/goodbadplotting.ipynb' },
                        { label: 'Complex visuals', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/complexvisuals.ipynb' },
                        { label: 'Advanced visuals', kind: 'colab',
                          href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/hardestvisuals.ipynb' }
                    ]
                },

                {
                    id: 'py-analysis',
                    label: 'Data Analysis',
                    blurb: 'Five method families, each with its own notebooks.',
                    status: 'ready',
                    lesson: 'https://spatialturn.github.io/DataAnalysis/',
                    children: [
                        {
                            id: 'py-geocoding',
                            label: 'Geocoding',
                            blurb: 'Turn addresses and place names into coordinates.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/DataAnalysis/introduction.html',
                            links: [
                                { label: 'Address based geocoding', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Address_based_geocode.ipynb' },
                                { label: 'Batch geocoding', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/batchgeocoding.ipynb' },
                                { label: 'OSM queries, intermediate', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/OSM_Query_intermediate.ipynb' }
                            ]
                        },
                        {
                            id: 'py-network',
                            label: 'Network Analysis',
                            blurb: 'Routes, travel time, and access along street networks.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/DataAnalysis/networkanalysis.html',
                            links: [
                                { label: 'Network analysis tutorial', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Network_Analysis_Tutorial.ipynb' },
                                { label: 'OSM network tutorial', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/OSM_Network_Tutorial.ipynb' }
                            ]
                        },
                        {
                            id: 'py-spatial',
                            label: 'Spatial Analysis',
                            blurb: 'Spatial weights and autocorrelation with PySAL.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/DataAnalysis/pysal.html',
                            links: [
                                { label: 'PySAL basics', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/pysal_basic.ipynb' },
                                { label: 'More PySAL notebooks coming soon', kind: 'colab' }
                            ]
                        },
                        {
                            id: 'py-cluster',
                            label: 'Spatial Clustering',
                            blurb: 'Find regions and groups hiding in point patterns.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/DataAnalysis/cluster.html',
                            links: [
                                { label: 'Spatial clustering notebook', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/spatialclustering.ipynb' },
                                { label: 'More clustering notebooks coming soon', kind: 'colab' }
                            ]
                        },
                        {
                            id: 'py-ndvi',
                            label: 'NDVI Analysis',
                            blurb: 'Vegetation indices from satellite imagery with rasterio.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/DataAnalysis/ndvi.html',
                            links: [
                                { label: 'NDVI for Indiana', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/NDVI_Indiana.ipynb' },
                                { label: 'More NDVI notebooks coming soon', kind: 'colab' }
                            ]
                        }
                    ]
                },

                {
                    id: 'py-cases',
                    label: 'Case Studies',
                    blurb: 'Practical exercises that chain the modules together.',
                    status: 'ready',
                    children: [
                        {
                            id: 'py-case-fooddesert',
                            label: 'Food Desert Analysis',
                            blurb: 'Demographics, store access, and TIGER geographies.',
                            status: 'ready',
                            lesson: 'https://spatialturn.github.io/CaseStudyFoodDesert/',
                            links: [
                                { label: 'TIGER food desert tutorial', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/TIGER_FoodDesert_Tutorial.ipynb' },
                                { label: 'Automated food desert analysis', kind: 'colab',
                                  href: 'https://colab.research.google.com/github/SpatialTurn/DataCollection-Notebooks/blob/main/Census/Food_Desert_Analysis_Automated.ipynb' }
                            ]
                        },
                        {
                            id: 'py-case-more',
                            label: 'More Case Studies',
                            blurb: 'Further applied exercises are being written.',
                            status: 'soon',
                            links: [
                                { label: 'Case study coming soon', kind: 'colab' }
                            ]
                        }
                    ]
                }
            ]
        }
    ],

    /* ────────────────────────────────────────────────
       COMMON GROUND
       Shared by both routes. Both trunks converge here.
       ──────────────────────────────────────────────── */
    shared: {
        id: 'foundation',
        label: 'Common Ground',
        blurb: 'Whichever route you take, your data needs a home and a future. These modules are shared by both.',
        children: [
            {
                id: 'shared-management',
                label: 'Data Management',
                blurb: 'File structures, naming conventions, and version control.',
                status: 'soon',
                lesson: 'https://spatialturn.github.io/DataManagement/',
                links: [
                    { label: 'Feature class manipulation', kind: 'lesson',
                      href: 'https://spatialturn.github.io/DataManagement/data-management.html' }
                ]
            },
            {
                id: 'shared-curation',
                label: 'Data Curation',
                blurb: 'Metadata, documentation, preservation, and sharing.',
                status: 'soon',
                lesson: 'https://spatialturn.github.io/datacurationmain/',
                links: [
                    { label: 'Introduction to data curation', kind: 'lesson',
                      href: 'https://spatialturn.github.io/datacurationmain/introduction.html' },
                    { label: 'Additional topics', kind: 'lesson',
                      href: 'https://spatialturn.github.io/datacurationmain/globaldata.html' },
                    { label: 'Build your own Carpentries lesson', kind: 'doc',
                      href: 'https://spatialturn.github.io/DataCuration/carpentry.html' },
                    { label: 'Additional readings', kind: 'doc',
                      href: 'https://spatialturn.github.io/DataCuration/data-curation.html' }
                ]
            }
        ]
    }
};
