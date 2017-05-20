/*
 *  Copyright (c) 2017 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
/* eslint-env node */
const SDPUtils = require('sdp');
const EventEmitter = require('events');

module.exports = function() {
  // required by the shim to mock an EventEmitter.
  global.document = {
    createDocumentFragment: () => {
      let e = new EventEmitter();
      e.addEventListener = e.addListener.bind(e);
      e.removeEventListener = e.removeListener.bind(e);
      e.dispatchEvent = function(ev) {
        e.emit(ev.type, ev);
      };
      return e;
    }
  };
  global.Event = function(type) {
    this.type = type;
  };

  global.RTCSessionDescription = function(init) {
    return init;
  };

  const RTCIceGatherer = function(options) {
    this.component = 'rtp';

    let candidates = [
      {
        foundation: '702786350',
        priority: 41819902,
        protocol: 'udp',
        ip: '8.8.8.8',
        port: 60769,
        type: 'host'
      },
      {}
    ];
    this._emittedCandidates = [];
    let emitCandidate = () => {
      let e = new Event('RTCIceGatherEvent');
      e.candidate = candidates.shift();
      if (Object.keys(e.candidate).length) {
        this._emittedCandidates.push(e.candidate);
      }
      if (this.onlocalcandidate) {
        this.onlocalcandidate(e);
      }
      if (candidates.length) {
        setTimeout(emitCandidate, 50);
      }
    };
    setTimeout(emitCandidate, 50);
  };

  RTCIceGatherer.prototype.getLocalCandidates = function() {
    return this._emittedCandidates;
  };

  RTCIceGatherer.prototype.getLocalParameters = function() {
    return {
      usernameFragment: 'someufrag',
      password: 'somepass'
    };
  };
  global.RTCIceGatherer = RTCIceGatherer;

  const RTCIceTransport = function() {
    this._remoteCandidates = [];
  };
  RTCIceTransport.prototype.start = function(gatherer, parameters, role) {
    this._gatherer = gatherer;
    this._remoteParameters = parameters;
    this._role = role || 'controlled';
  };
  RTCIceTransport.prototype.addRemoteCandidate = function(remoteCandidate) {
    if (Object.keys(remoteCandidate).length) {
      this._remoteCandidates.push(remoteCandidate);
    }
  };
  RTCIceTransport.prototype.setRemoteCandidates = function(remoteCandidates) {
    this._remoteCandidates = remoteCandidates;
  };
  RTCIceTransport.prototype.getRemoteCandidates = function() {
    return this._remoteCandidates;
  };
  RTCIceTransport.prototype.getRemoteParameters = function() {
    return this._remoteParameters;
  };
  global.RTCIceTransport = RTCIceTransport;

  const RTCDtlsTransport = function(transport) {
    this.transport = transport;
  };
  RTCDtlsTransport.prototype.start = function() {};
  RTCDtlsTransport.prototype.getLocalParameters = function() {
    return {
      role: 'auto',
      fingerprints: [
        {
          algorithm: 'alg',
          value: 'fi:ng:ger:pr:in:t1'
        }
      ]
    };
  };
  global.RTCDtlsTransport = RTCDtlsTransport;

  function getCapabilities(kind) {
    var opus = {
      name: 'opus',
      kind: 'audio',
      clockRate: 48000,
      preferredPayloadType: 111,
      numChannels: 2
    };
    var vp8 = {
      name: 'vp8',
      kind: 'video',
      clockRate: 90000,
      preferredPayloadType: 100,
      numChannels: 1
    };
    var rtx = {
      name: 'rtx',
      kind: 'video',
      clockRate: 90000,
      preferredPayloadType: 101,
      numChannels: 1,
      parameters: {apt: 100}
    };
    var codecs;
    switch (kind) {
      case 'audio':
        codecs = [opus];
        break;
      case 'video':
        codecs = [vp8, rtx];
        break;
      default:
        codecs = [opus, vp8, rtx];
        break;
    }
    return {
      codecs: codecs,
      headerExtensions: []
    };
  }

  const RTCRtpReceiver = function(transport, kind) {
    this.track = new MediaStreamTrack();
    this.track.kind = kind;
    this.transport = transport;
  };
  RTCRtpReceiver.prototype.receive = function() {};
  RTCRtpReceiver.prototype.setTransport = function(transport) {
    this.transport = transport;
  };

  RTCRtpReceiver.getCapabilities = getCapabilities;
  global.RTCRtpReceiver = RTCRtpReceiver;

  const RTCRtpSender = function(track, transport) {
    this.track = track;
    this.transport = transport;
  };
  RTCRtpSender.prototype.send = function() {};
  RTCRtpSender.prototype.setTransport = function(transport) {
    this.transport = transport;
  };

  RTCRtpSender.getCapabilities = getCapabilities;
  global.RTCRtpSender = RTCRtpSender;

  global.MediaStream = function(tracks) {
    this.id = SDPUtils.generateIdentifier();
    this._tracks = tracks || [];
    this.getTracks = () => this._tracks;
    this.getAudioTracks = () => this._tracks.filter(t => t.kind === 'audio');
    this.getVideoTracks = () => this._tracks.filter(t => t.kind === 'video');
    this.addTrack = (t) => this._tracks.push(t);
  };
  global.MediaStreamTrack = function() {
    this.id = SDPUtils.generateIdentifier();
  };
};
