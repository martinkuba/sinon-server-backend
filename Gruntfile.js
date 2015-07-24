
module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                jshintrc: 'jshintrc.json'
            },

            source: [
                'lib/**/*.js'
            ]
        },

        karma: {            
            options: {
                configFile: 'karma.conf.js'                     
            },
            unit: {
                singleRun: true
            },          
            dev: {
                singleRun: false,
                browsers: ['Chrome']
            }
        }

    });

    grunt.registerTask('test', ['jshint', 'karma:unit']);
}