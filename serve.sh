#!/usr/bin/env bash
# ローカルプレビュー用。 http://localhost:4000
#
# このマシンには ruby-dev / docker 権限が無く gem のネイティブビルドができないため、
# Singularity の ruby:3.2 コンテナ経由で Jekyll を動かしている。
# gem 一式は $GEMS に入っている（初回セットアップ済み）。
set -euo pipefail

GEMS="${JEKYLL_GEMS_DIR:-/diskthalys/ssd14ta/yharada/.jekyll-gems}"

export SINGULARITY_CACHEDIR="${SINGULARITY_CACHEDIR:-/diskthalys/ssd14ta/yharada/.sifcache}"
export SINGULARITYENV_GEM_HOME=/gems
export SINGULARITYENV_GEM_PATH=/gems
export SINGULARITYENV_PATH=/gems/bin:/usr/local/bin:/usr/bin:/bin
# Gemfile.lock は無視して /gems の gem を直接使う
export SINGULARITYENV_JEKYLL_NO_BUNDLER_REQUIRE=true

cd "$(dirname "$0")"
exec singularity exec --bind "$GEMS":/gems docker://ruby:3.2 \
  jekyll "${1:-serve}" "${@:2}"
