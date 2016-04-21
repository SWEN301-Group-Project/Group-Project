module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            main: {
                src: 'static/js/<%= pkg.name %>.js',
                dest: 'static/js/<%= pkg.name %>.min.js'
            }
        },
        less: {
            expanded: {
                options: {
                    paths: ["static/less"]
                },
                files: {
                    "static/css/<%= pkg.name %>.css": "static/less/<%= pkg.name %>.less"
                }
            },
            minified: {
                options: {
                    paths: ["static/css"],
                    cleancss: true
                },
                files: {
                    "static/css/<%= pkg.name %>.min.css": "static/less/<%= pkg.name %>.less"
                }
            }
        },
        banner: '/*!\n' +
            ' * <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2013-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Website based on ' +
            ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n' +
            ' */\n',
        usebanner: {
            dist: {
                options: {
                    position: 'top',
                    banner: '<%= banner %>'
                },
                files: {
                    src: ['static/css/<%= pkg.name %>.css', 'static/css/<%= pkg.name %>.min.css', 'static/js/<%= pkg.name %>.min.js']
                }
            }
        },
        watch: {
            scripts: {
                files: ['static/js/<%= pkg.name %>.js'],
                tasks: ['uglify'],
                options: {
                    spawn: false,
                },
            },
            less: {
                files: ['static/less/*.less'],
                tasks: ['less'],
                options: {
                    spawn: false,
                }
            },
        },
    });

    // Load the plugins.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'less', 'usebanner']);
    //grunt.registerTask('develop', ['simplemocha', 'uglify', 'less', 'usebanner']);

};