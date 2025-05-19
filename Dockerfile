ARG UBUNTU_VERSION=24.04
ARG OCAML_VERSION=5.3

FROM ocaml/opam:ubuntu-${UBUNTU_VERSION}-ocaml-${OCAML_VERSION}

USER root

ARG SWI_PROLOG_VERSION=9.2.9

RUN apt-get update && apt-get install -y software-properties-common \
  && add-apt-repository -y ppa:swi-prolog/stable \
  && apt-get update \
  && apt-get install -y swi-prolog=${SWI_PROLOG_VERSION}-*

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash

ENV NVM_DIR=$HOME/.nvm

RUN bash -c "source $NVM_DIR/nvm.sh && nvm install 20"

USER opam

ARG TAG=main

RUN opam update \
  && opam install dune menhir \
  && opam pin add -y fl_jikken https://github.com/ut-is-fl-jikken/fl_jikken.git#${TAG} \
  && opam upgrade
