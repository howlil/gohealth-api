const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');

class SwaggerMiddleware {
    static setup(app) {
        let swaggerSpec;
        const yamlPath = path.join(__dirname, '../../docs/swagger.yaml');

        if (fs.existsSync(yamlPath)) {
            swaggerSpec = YAML.load(yamlPath);
        } else {
            swaggerSpec = require('../config/swagger.config');
        }

        // Redirect misspelled URL to correct path
        app.get('/api-dosc', (req, res) => {
            res.redirect('/api-docs');
        });

        app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
            explorer: true,
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: 'GoHealth API Documentation',
            customfavIcon: '/favicon.ico',
            swaggerOptions: {
                persistAuthorization: true,
                docExpansion: 'none',
                filter: true,
                displayRequestDuration: true
            }
        }));

        app.get('/api-docs.json', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.send(swaggerSpec);
        });
    }
}

module.exports = SwaggerMiddleware; 