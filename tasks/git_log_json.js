/*
 * grunt-git-log-json
 * https://github.com/nlaplante/grunt-git-log-json
 *
 * Copyright (c) 2014 Nicolas Laplante
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  grunt.registerTask('git_log_json', 'Generate json from git log via grunt task', function () {
  
  	var done = this.async();
  
  	// Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      shortHash: grunt.option('shortHash') === true,
      dest: grunt.option('dest') || 'changelog.json'
    });
    
    grunt.verbose.writeflags(options);
    
    var commitHashFormat = options.shortHash ? 'h' : 'H';
  	  	
  	var proc = grunt.util.spawn({
  		cmd: 'git',
  		args: ['log', '--pretty=format:{%n	"commit": "%' + commitHashFormat + '",%n	"author": "%an <%ae>",%n	"date": "%ad",%n	"message": "%s"%n},']
  	}, function (error, result, code) {
  		
  		var strResult = String(result);
  		
  		if (code !== 0) {
  			grunt.log.writeln('git log command failed (' + strResult + ')');
			done();
  		}
  		
  		var json = "[" + strResult + "]";
  		json = json.replace('},]', '}]');
  		json += '\n';
  		
  		grunt.file.write(options.dest, json);
  		
  		done();
  	});
  	
  });

};
