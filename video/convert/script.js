(function () {
    const videoUpload = document.getElementById('videoUpload');
    const videoPlayer = document.getElementById('videoPlayer');
    const previewCanvas = document.getElementById('previewCanvas');
    const videoInfo = document.getElementById('videoInfo');
    const settingsSection = document.getElementById('settingsSection');
    const outputSection = document.getElementById('outputSection');
    const outputVideo = document.getElementById('outputVideo');
    const convertBtn = document.getElementById('convertBtn');
    const convertBtnText = document.getElementById('convertBtnText');
    const convertBtnLoading = document.getElementById('convertBtnLoading');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const convertNote = document.getElementById('convertNote');
    const formatInfoText = document.getElementById('formatInfoText');
    const resultInfo = document.getElementById('resultInfo');
    const outputFormat = document.getElementById('outputFormat');
    const videoQuality = document.getElementById('videoQuality');
    const videoBitrate = document.getElementById('videoBitrate');
    const audioBitrate = document.getElementById('audioBitrate');
    const resolutionScale = document.getElementById('resolutionScale');
    const customWidth = document.getElementById('customWidth');
    const frameRate = document.getElementById('frameRate');
    const keepAudio = document.getElementById('keepAudio');
    const customBitrateRow = document.getElementById('customBitrateRow');
    const customResRow = document.getElementById('customResRow');
    const modal = document.getElementById('defaultModal');
    const modalMessage = document.getElementById('modalMessage');

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    let sourceFile = null;
    let outputBlob = null;
    let cancelConversion = false;

    function showModal(msg) {
        modalMessage.textContent = msg;
        modal.classList.add('active');
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(2) + ' MB';
    }

    function formatDuration(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function getExtension(filename) {
        return (filename.split('.').pop() || '').toLowerCase();
    }

    function getQualityBitrate() {
        switch (videoQuality.value) {
            case 'high': return 5000;
            case 'medium': return 2500;
            case 'low': return 1000;
            case 'custom': return parseInt(videoBitrate.value) || 2500;
            default: return 2500;
        }
    }

    function getTargetResolution(origW, origH) {
        var scale = resolutionScale.value;
        if (scale === 'custom') {
            var w = parseInt(customWidth.value) || origW;
            var ratio = origH / origW;
            return { width: w, height: Math.round(w * ratio) };
        }
        var pct = parseInt(scale) / 100;
        return { width: Math.round(origW * pct), height: Math.round(origH * pct) };
    }

    function getSupportedMime() {
        var fmt = outputFormat.value;
        var codecs = [];
        if (fmt === 'webm') {
            codecs = ['video/webm;codecs=vp8', 'video/webm;codecs=vp8.0', 'video/webm'];
        } else if (fmt === 'webm-vp9') {
            codecs = ['video/webm;codecs=vp9', 'video/webm;codecs=vp9.0', 'video/webm;codecs=vp8', 'video/webm'];
        } else if (fmt === 'mp4') {
            codecs = ['video/mp4;codecs=avc1', 'video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp8', 'video/webm'];
        }
        for (var i = 0; i < codecs.length; i++) {
            if (MediaRecorder.isTypeSupported(codecs[i])) {
                return codecs[i];
            }
        }
        return 'video/webm';
    }

    function updateFormatInfo() {
        var mime = getSupportedMime();
        var ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
        var msg;
        if (ext === 'mp4') {
            msg = '将输出 MP4 (H.264) 格式，兼容大多数播放器和设备';
        } else if (mime.includes('vp9')) {
            msg = '将输出 WebM (VP9) 格式，体积更小但转换较慢';
        } else {
            msg = '将输出 WebM (VP8) 格式，兼容性良好';
        }
        if ((outputFormat.value === 'mp4' && ext !== 'mp4') ||
            (outputFormat.value === 'webm-vp9' && !mime.includes('vp9'))) {
            msg += '（注意：浏览器不支持所选编码，已自动降级）';
        }
        formatInfoText.textContent = msg;
    }

    outputFormat.addEventListener('change', updateFormatInfo);
    videoQuality.addEventListener('change', function () {
        customBitrateRow.style.display = videoQuality.value === 'custom' ? '' : 'none';
    });
    resolutionScale.addEventListener('change', function () {
        customResRow.style.display = resolutionScale.value === 'custom' ? '' : 'none';
    });

    videoUpload.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            showModal('文件大小超过100MB限制。当前文件大小：' + formatSize(file.size));
            videoUpload.value = '';
            return;
        }
        resetAll();
        sourceFile = file;
        outputBlob = null;
        var url = URL.createObjectURL(file);
        videoPlayer.src = url;

        videoPlayer.onloadedmetadata = function () {
            var ext = getExtension(file.name);
            var w = videoPlayer.videoWidth;
            var h = videoPlayer.videoHeight;
            var dur = videoPlayer.duration;
            videoInfo.innerHTML =
                '<p><strong>文件名：</strong>' + file.name + '</p>' +
                '<p><strong>原始格式：</strong>' + ext.toUpperCase() + ' | ' +
                '<strong>分辨率：</strong>' + w + 'x' + h + ' | ' +
                '<strong>时长：</strong>' + formatDuration(dur) + ' | ' +
                '<strong>大小：</strong>' + formatSize(file.size) + '</p>';
            settingsSection.style.display = '';
            updateFormatInfo();
            customWidth.value = w;
            convertBtn.disabled = false;
        };
    });

    function resetAll() {
        videoPlayer.controls = true;
        videoPlayer.onended = null;
        outputSection.style.display = 'none';
        convertBtn.disabled = true;
        convertBtnText.style.display = '';
        convertBtnLoading.style.display = 'none';
        progressContainer.style.display = 'none';
        convertNote.style.display = 'none';
    }

    convertBtn.addEventListener('click', function () {
        if (!sourceFile) return;
        startConversion();
    });

    function startConversion() {
        var video = videoPlayer;
        if (video.readyState < 2) {
            showModal('视频尚未加载完成，请稍后再试。');
            return;
        }

        cancelConversion = false;
        convertBtn.disabled = true;
        convertBtnText.style.display = 'none';
        convertBtnLoading.style.display = '';
        progressContainer.style.display = '';
        progressBar.style.width = '0%';
        progressPercentage.textContent = '0%';
        convertNote.style.display = '';
        convertNote.textContent = '正在准备...';
        outputSection.style.display = 'none';

        var origW = video.videoWidth;
        var origH = video.videoHeight;
        var targetRes = getTargetResolution(origW, origH);
        var fpsSelect = parseInt(frameRate.value) || 0;
        var includeAudio = keepAudio.checked;
        var videoBitrateVal = getQualityBitrate() * 1000;
        var duration = video.duration;
        var needsCanvas = (targetRes.width !== origW || targetRes.height !== origH || fpsSelect > 0);

        // Setup canvas (stays hidden, only used internally for resizing)
        var canvas = previewCanvas;
        var ctx;
        if (needsCanvas) {
            canvas.width = targetRes.width;
            canvas.height = targetRes.height;
            ctx = canvas.getContext('2d');
        }

        // Prepare video for playback — keep visible as progress feedback
        video.muted = true;
        video.playsInline = true;
        video.controls = false;
        video.currentTime = 0;

        var chunks = [];
        var recorder;
        var startTime = Date.now();

        function cleanup() {
            video.controls = true;
            video.onended = null;
            convertBtnText.style.display = '';
            convertBtnLoading.style.display = 'none';
            convertBtn.disabled = !sourceFile;
            progressContainer.style.display = 'none';
            convertNote.style.display = 'none';
        }

        function onError(msg) {
            cancelConversion = true;
            if (recorder && recorder.state === 'recording') {
                try { recorder.stop(); } catch (e) { }
            }
            cleanup();
            showModal(msg);
        }

        // Step 1: Start playback first
        video.play().then(function () {
            convertNote.textContent = '转换中...';

            // Step 2: Now that video is playing, capture the stream
            var sourceStream;
            try {
                sourceStream = video.captureStream(fpsSelect || undefined);
            } catch (e) {
                sourceStream = video.captureStream();
            }

            var videoTracks = sourceStream.getVideoTracks();
            if (videoTracks.length === 0) {
                onError('无法获取视频轨道，该格式可能不被浏览器支持。');
                return;
            }

            // Step 3: Build final stream (canvas for resize, or direct)
            if (needsCanvas) {
                var canvasStream = canvas.captureStream(fpsSelect || 30);
                var canvasVideoTrack = canvasStream.getVideoTracks()[0];
                var combined = new MediaStream();
                combined.addTrack(canvasVideoTrack);
                if (includeAudio) {
                    sourceStream.getAudioTracks().forEach(function (t) { combined.addTrack(t); });
                }
                sourceStream = combined;
            } else if (!includeAudio) {
                sourceStream.getAudioTracks().forEach(function (t) { t.stop(); });
            }

            // Step 4: Create MediaRecorder with the live stream
            var mimeType = getSupportedMime();
            try {
                recorder = new MediaRecorder(sourceStream, {
                    mimeType: mimeType,
                    videoBitsPerSecond: videoBitrateVal
                });
            } catch (e) {
                try {
                    recorder = new MediaRecorder(sourceStream, {
                        mimeType: 'video/webm',
                        videoBitsPerSecond: videoBitrateVal
                    });
                    mimeType = 'video/webm';
                } catch (e2) {
                    onError('浏览器不支持视频录制。请使用 Chrome 或 Edge 浏览器。');
                    return;
                }
            }

            recorder.ondataavailable = function (e) {
                if (e.data && e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = function () {
                if (cancelConversion) return;
                var actualMime = recorder.mimeType || mimeType || 'video/webm';
                var ext = actualMime.startsWith('video/mp4') ? 'mp4' : 'webm';
                outputBlob = new Blob(chunks, { type: actualMime });

                if (outputBlob.size === 0) {
                    showModal('转换失败：可能是浏览器不支持该视频编码格式。');
                    cleanup();
                    return;
                }

                var outUrl = URL.createObjectURL(outputBlob);
                outputVideo.src = outUrl;
                outputSection.style.display = '';

                var origName = sourceFile.name.replace(/\.[^.]+$/, '');
                resultInfo.innerHTML =
                    '<p><strong>输出格式：</strong>' + ext.toUpperCase() + ' | ' +
                    '<strong>分辨率：</strong>' + targetRes.width + 'x' + targetRes.height + ' | ' +
                    '<strong>大小：</strong>' + formatSize(outputBlob.size) + ' | ' +
                    '<strong>压缩比：</strong>' + (sourceFile.size > 0 ? (outputBlob.size / sourceFile.size * 100).toFixed(1) : '0.0') + '%</p>';
                downloadBtn.onclick = function () {
                    var a = document.createElement('a');
                    a.href = outUrl;
                    a.download = origName + '_converted.' + ext;
                    a.click();
                };

                cleanup();
            };

            recorder.onerror = function (e) {
                onError('录制出错：' + (e.error ? e.error.message : '未知错误'));
            };

            // Step 5: Start recording
            try {
                recorder.start(250);
            } catch (e) {
                onError('启动录制失败：' + e.message);
                return;
            }

            // Step 6: Draw canvas frames if needed
            if (needsCanvas) {
                drawCanvasFrames();
            }

            // Step 7: Monitor progress
            monitorProgress();
        }).catch(function (e) {
            onError('视频播放失败：' + e.message + '。该视频格式可能不被浏览器支持。');
        });

        function drawCanvasFrames() {
            if (cancelConversion) return;
            if (video.ended || (video.paused && video.currentTime >= duration - 0.2)) return;
            ctx.drawImage(video, 0, 0, targetRes.width, targetRes.height);
            requestAnimationFrame(drawCanvasFrames);
        }

        function monitorProgress() {
            if (cancelConversion || video.ended) return;
            var progress = Math.min(video.currentTime / duration * 100, 99);
            progressBar.style.width = progress + '%';
            progressPercentage.textContent = Math.round(progress) + '%';
            var elapsed = (Date.now() - startTime) / 1000;
            var remaining = progress > 1 ? (elapsed / progress * (100 - progress)) : 0;
            convertNote.textContent = '转换中... 剩余约 ' + Math.ceil(remaining) + ' 秒';

            if (video.ended || (video.paused && video.currentTime >= duration - 0.2)) {
                if (recorder && recorder.state === 'recording') {
                    recorder.stop();
                }
                return;
            }
            requestAnimationFrame(monitorProgress);
        }

        video.onended = function () {
            if (recorder && recorder.state === 'recording') {
                recorder.stop();
            }
        };
    }

    settingsSection.style.display = 'none';
    outputSection.style.display = 'none';
    updateFormatInfo();
})();
