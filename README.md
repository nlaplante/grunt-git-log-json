# grunt-git-log-json

> Generate json from git log via grunt task

This grunt plugin will analyze the output of `git log` and generate a JSON formatted data structure listing all commits for each tag.
For this to work, tags need to use the [semver versioning scheme](http://semver.org/).

## Getting Started
This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-git-log-json --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-git-log-json');
```

## The "git_log_json" task

### Overview
In your project's Gruntfile, add a section named `git_log_json` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  git_log_json: {
  	options: {
  		dest: 'changelog.json',
  		shortHash: true
  	}
  }
})
```

### Options
#### shortHash
If true, the generated sha hash will be shortened. Default: `false`

#### dest
The file to write the JSON changelog to. Default is `changelog.json`.

> filter
Regex object used to restrict the changelog to the matching tag names. Default is `null` (no filter)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
* 0.0.7 Fix potential JSON parsing problems
* 0.0.6 Don't die if it encounters a non-semver tag; ignore it instead
* 0.0.5 Graceful fail and add filter option
* 0.0.4 Use semver versioning scheme
* 0.0.3 Fix tag sorting
* 0.0.2 First working release
* 0.0.1 First release

## License
Copyright (c) 2014 Nicolas Laplante. Licensed under the MIT license.
