/*
 * grunt-git-log-json
 * https://github.com/nlaplante/grunt-git-log-json
 *
 * Copyright (c) 2014 Nicolas Laplante
 * Licensed under the MIT license.
 */
 
/* 
%H: commit hash
%h: abbreviated commit hash
%T: tree hash
%t: abbreviated tree hash
%P: parent hashes
%p: abbreviated parent hashes
%an: author name
%aN: author name (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%ae: author email
%aE: author email (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%ad: author date (format respects --date= option)
%aD: author date, RFC2822 style
%ar: author date, relative
%at: author date, UNIX timestamp
%ai: author date, ISO 8601 format
%cn: committer name
%cN: committer name (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%ce: committer email
%cE: committer email (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%cd: committer date
%cD: committer date, RFC2822 style
%cr: committer date, relative
%ct: committer date, UNIX timestamp
%ci: committer date, ISO 8601 format
%d: ref names, like the --decorate option of git-log(1)
%e: encoding
%s: subject
%f: sanitized subject line, suitable for a filename
%b: body
%B: raw body (unwrapped subject and body)
%N: commit notes
%GG: raw verification message from GPG for a signed commit
%G?: show either "G" for Good or "B" for Bad for a signed commit
%GS: show the name of the signer for a signed commit
%gD: reflog selector, e.g., refs/stash@{1}
%gd: shortened reflog selector, e.g., stash@{1}
%gn: reflog identity name
%gN: reflog identity name (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%ge: reflog identity email
%gE: reflog identity email (respecting .mailmap, see git-shortlog(1) or git-blame(1))
%gs: reflog subject
%Cred: switch color to red
%Cgreen: switch color to green
%Cblue: switch color to blue
%Creset: reset color
%C(…): color specification, as described in color.branch.* config option
%m: left, right or boundary mark
%n: newline
%%: a raw %
%x00: print a byte from a hex code
%w([<w>[,<i1>[,<i2>]]]): switch line wrapping, like the -w option of git-shortlog(1).
*/

'use strict';

module.exports = function (grunt) {

    var jsesc = require('jsesc'),
        async = require('async'),
        semver = require('semver'),
        gitCommand = 'git',
        SEPARATOR = ',';
    
    /**
     * Do pre-task checks
     */
    function checkPrerequisites (cb) {
    	verifyGitExecutableExistence(function (error, result) {
    		if (error) {
    			return cb(error, null);
    		}
    		
    		verifyGitRepo(function (error, result) {
    			if (error) {
    				return cb(error, null);
    			}
    			
    			cb(null, null);
    		});
    	});
    }
    
    /**
     * Verify that the git command exists
     */
    function verifyGitExecutableExistence (cb) {
    
    	grunt.verbose.writeln('Checking for ' + gitCommand + ' command existence');
    	
    	grunt.util.spawn({
    		cmd: 'which',
    		args: [gitCommand]
    	}, function (error, result, code) {
    		if (code != 0) {
    			grunt.verbose.error(gitCommand + ' not found (' + code + ')');
    			cb(error, null);
    			return;
    		}
    		
    		cb(null, null);
    	});
    }
    
    /**
     * Verify that we are in a Git repository
     */    
    function verifyGitRepo (cb) {
    
    	grunt.verbose.writeln('Checking if we are in a git repository');
    	
    	grunt.util.spawn({
    		cmd: gitCommand,
    		args: ['status']
    	}, function (error, result, code) {

    		if (code != 0) {
    			grunt.verbose.error('Not a git repository. Make sure you\'re working in a git repository and not from a downloaded archive');
    			cb(error, null);
    			return;
    		}
    		
    		cb(null, null);
    	});
    }

    /**
     * List all tags in descending order, according to semver tagging syntax
     */
    function listTags (regex, cb) {
        grunt.util.spawn({
            cmd: gitCommand,
            args: ['tag', '-l']
        }, function (error, result, code) {
            if (code != 0) {
                return cb(error, null);
            }

            // split each line, then sort
            var tags = String(result).split('\n');
            
            // filter out unwanted tags

		    tags = tags.filter(function (item) {
		       	// first check if we are a valid semver string
		       	if (!semver.valid(item)) {
			       	grunt.log.errorlns('tag: ' + item + ' is not semver compliant; discarded');
			       	return false;
		       	}	
		       	
		       	// semver is valid; check if we match (optional) regex
		       	if (regex) {
			       	return regex.test(item);
		       	}
		       	
		       	return true;
			});
            
            // sort tags
            tags = semver.sort(tags);
            
            return cb(null, tags);
        });
    }

    /**
     * Generate commit log between 2 tags
     */
    function gitLogBetween(startTag, endTag, formatString, cb) {
    	
        grunt.util.spawn({
            cmd: gitCommand,
            args: ['log', '--pretty=format:' + formatString, startTag + '..' + endTag]
        }, function (error, result, code) {
            if (code != 0) {
                return cb(error, null);                
            }

            var strResult = String(result);

             // read each line and convert it to json
	        var length = strResult.length,
		        cPos = 0,
		        cLine = 0,
		        numLines = 0,
		        json = '';
		
	        while (cPos < length) {
		        var eolPos = strResult.indexOf('\n', cPos);
		
		        if (eolPos == -1) {
			        eolPos = length;
		        }
		
		        var line = strResult.substr(cPos, eolPos - cPos);			
		
		        json += csvLineToJson(line, eolPos == length);
		
		        cPos = eolPos + 1;
		
		        if (cPos < length) {
			        numLines++;
		        }
	        }
	
	        if (numLines > 1) {
		        //json = '[' + json + ']';
	        }
	        
	        cb(null, json);
	        
	        
        });
    }

    /**
     * Convert a CSV format string to json
     *
     * CSV format is as follow: 'SHA,AUTHOR,DATE,MESSAGE'
     *
     * @param input the csv string to convert
     * @param isLast if false, will append a comma to the end of the input
     *
     * @return the json version of input string
     */
    function csvLineToJson (input, isLast) {

	    if (!input || !input.length) {
		    return '';
	    }
	
	    var json = '{',	
		    splitInput = input.split(SEPARATOR),
		    sha = splitInput[0],
		    author = splitInput[1],
		    date = splitInput[2],
		    message = splitInput[3];

        // Assume all remaining slices are from the message, which could contain commas
	    if (splitInput.length > 4) {
	
	        var slicesCount = splitInput.length;
	        
	        for (var i = 4; i < slicesCount; i++) {
	            message += splitInput[i];
	        }
	    }
	
	    json += '"sha":"' + sha + '",';
	    json += '"author":"' + author + '",';
	    json += '"date":"' + date + '",';
	    json += '"message":"' + jsesc(message, { quotes: 'double'}) + '"';
	
	    json += '}';
	
	    if (!isLast) {
		    json += ',';
	    }
	
	    return json;
    }

    // register our Grunt task
    grunt.registerTask('git_log_json', 'Generate json from git log via grunt task', function () {
  
      	var done = this.async();
      
      	// Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
          shortHash: false,
          dest: 'changelog.json',
          filter: null
        });
        
        grunt.verbose.writeflags(options);
        
        var commitHashFormat = '%' + (options.shortHash ? 'h' : 'H');
        
        // create git log in CSV format 
        var gitLogCommandPrettyFormatString = commitHashFormat + SEPARATOR + 
            '%an <%ae>' + SEPARATOR + 
            '%ad' + SEPARATOR + 
            '%s%n';
            
            
        checkPrerequisites(function (error, result) {
        
        	if (error) {
        		done();
        		return;
        	}
        	
        	listTags(options.filter, function (err, tags) {
		        if (err) {
		            grunt.log.writeln('error getting tag list', err);
		            return done();
		        }
		        
		        tags = tags.reverse();
		        
		        grunt.verbose.writeln('Tags:', tags);

		        var json = '{';
		        
		        var loopMax = tags.length;
		        var tagTwins = [];

		        for (var i = 0; i < loopMax; i++) {
		        
		            var tag1 = tags[i], 
		                tag2 = i < loopMax - 1 ? tags[i + 1] : '';
		                
		            tagTwins.push([tag2, tag1]);
		        }
		        
		        async.eachSeries(tagTwins, function (value, cb) {
		        	var tag1 = value[1],
		        		tag2 = value[0];
		        		
		        	if (tag1) {
		            
		            	grunt.log.writeln('getting commits between ' + tag1 + ' and ' + (tag2 || 'the big bang'));
		            
		            	json += '"' + tag1 + '": [';
		            	                
		                gitLogBetween(tag2, tag1, gitLogCommandPrettyFormatString, function (err, jsonString) {
		                
		                	if (err) {
			                	grunt.log.writeln(err);
		                    	return cb(err, null);
		                	}
			                
			                json += jsonString;
			                
			                json += '],';
		                
							cb(null, json);
			            });	
			        }
		        
			        }, function (err, result) {
		        
				    	if (err) {
					    	grunt.log.writeln('error occured!', err);
							return	done();
				    	}
				    	
					    json += '}';
				
						json = json.replace('],}', ']}');
				
						try {
							var parsed = JSON.parse(json);
							grunt.file.write(options.dest, json);
						}
						catch (e) {
							grunt.log.writeln('error parsing generated json', e);
							grunt.log.writeln(json);
							grunt.verbose.writeln('This is the generated git log input:');
							grunt.verbose.writeln(strResult);
						}
					
						done();
				    });
	        });
        });
    });
};

