#!/usr/bin/env python

from invoke import task


@task
def install(runner):
    """
    this will install all required packages listed in requirements.txt file
    """
    runner.run("pip install -r requirements.txt")


@task
def lint(runner):
    """
    this will run flake8 static code analysis
    """
    runner.run("flake8")


@task(lint)
def test(runner):
    """
    this will run lint then all discovered unittests
    """
    runner.run("python -m unittest discover -s ./test/ -v  -t .")


@task
def bump_build(runner):
    """
    this will bump the patch part of this module's version (major.minor.PATCH)
    """
    runner.run("bumpversion patch --verbose")


@task
def bump_minor(runner):
    """
    this will bump the minor part of this module's version (major.MINOR.patch)
    """
    runner.run("bumpversion minor")


@task
def bump_major(runner):
    """
    this will bump the major part of this module's version (MAJOR.minor.patch)
    """
    runner.run("bumpversion major")
