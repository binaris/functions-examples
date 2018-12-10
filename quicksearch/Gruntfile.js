module.exports = (grunt) => {
  grunt.loadNpmTasks('grunt-run');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    run: {
      npm_deploy: {
        cmd: 'npm',
        args: ['run', 'deploy'],
      },
    },
    watch: {
      scripts: {
        files: ['**/*.js', './package.json', 'binaris.yml', 'frontend/*', 'functions/*'],
        tasks: ['run'],
        options: { spawn: false },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('default', ['watch']);
  grunt.registerTask('deploy', ['run:npm_deploy']);
};
