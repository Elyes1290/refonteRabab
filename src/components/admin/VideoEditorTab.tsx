import React, { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

interface VideoFile {
  file: File;
  url: string;
  name: string;
  duration?: number;
}

interface AudioFile {
  file: File;
  url: string;
  name: string;
  duration?: number;
}

const VideoEditorTab: React.FC = () => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fichiers sélectionnés
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [musicFile, setMusicFile] = useState<AudioFile | null>(null);
  const [voiceFile, setVoiceFile] = useState<AudioFile | null>(null);

  // Prévisualisation
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  // Références pour les inputs
  const videoInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  // Initialiser FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegInstance = new FFmpeg();
      try {
        // Configuration avec CDN officiel pour éviter les problèmes d'import
        await ffmpegInstance.load({
          coreURL:
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js",
          wasmURL:
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm",
          workerURL:
            "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js",
        });
        setFfmpeg(ffmpegInstance);
        setIsLoaded(true);
        console.log("FFmpeg chargé avec succès depuis CDN");
      } catch (error) {
        console.error("Erreur lors du chargement de FFmpeg:", error);
        try {
          // Fallback avec la configuration par défaut
          await ffmpegInstance.load();
          setFfmpeg(ffmpegInstance);
          setIsLoaded(true);
          console.log("FFmpeg chargé avec la configuration par défaut");
        } catch (fallbackError) {
          console.error("Impossible de charger FFmpeg:", fallbackError);
          setIsLoaded(false);
        }
      }
    };
    loadFFmpeg();
  }, []);

  // Gestion des fichiers vidéo
  const handleVideoFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newVideoFiles: VideoFile[] = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setVideoFiles((prev) => [...prev, ...newVideoFiles]);
  };

  // Gestion de la musique
  const handleMusicFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMusicFile({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      });
    }
  };

  // Gestion de la voix
  const handleVoiceFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVoiceFile({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      });
    }
  };

  // Supprimer un fichier
  const removeVideoFile = (index: number) => {
    setVideoFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const removeMusicFile = () => {
    if (musicFile) {
      URL.revokeObjectURL(musicFile.url);
      setMusicFile(null);
    }
  };

  const removeVoiceFile = () => {
    if (voiceFile) {
      URL.revokeObjectURL(voiceFile.url);
      setVoiceFile(null);
    }
  };

  // Compiler la vidéo
  const compileVideo = async () => {
    if (!ffmpeg) {
      alert("Erreur: FFmpeg n'est pas chargé. Veuillez recharger la page.");
      return;
    }

    if (videoFiles.length === 0) {
      alert("Veuillez sélectionner au moins une vidéo.");
      return;
    }

    setIsProcessing(true);
    try {
      console.log("Début de la compilation vidéo...");

      // Écrire et normaliser les fichiers dans FFmpeg
      for (let i = 0; i < videoFiles.length; i++) {
        console.log(`Écriture du fichier vidéo ${i}: ${videoFiles[i].name}`);

        // Écrire le fichier original
        const originalName = `original_video${i}.${videoFiles[i].file.name
          .split(".")
          .pop()}`;
        await ffmpeg.writeFile(
          originalName,
          await fetchFile(videoFiles[i].file)
        );

        // Essayer d'abord sans normalisation (plus rapide)
        console.log(`Copie simple du fichier vidéo ${i}...`);
        try {
          // Simple copie d'abord
          const copyCommand = [
            "-i",
            originalName,
            "-c",
            "copy",
            `video${i}.mp4`,
          ];
          console.log(`Commande de copie ${i}:`, copyCommand.join(" "));

          // Timeout de 30 secondes pour éviter les blocages
          const copyPromise = ffmpeg.exec(copyCommand);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout sur la copie")), 30000)
          );

          await Promise.race([copyPromise, timeoutPromise]);
          console.log(`Copie ${i} terminée avec succès`);
        } catch (copyError) {
          console.log(
            `Copie simple échouée pour ${i}, tentative de normalisation légère...`
          );

          // Si la copie échoue, normalisation légère (résolution plus petite)
          const normalizeCommand = [
            "-i",
            originalName,
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "-preset",
            "ultrafast", // Plus rapide
            "-s",
            "854x480", // Résolution plus petite
            "-r",
            "25", // Frame rate plus bas
            `video${i}.mp4`,
          ];

          console.log(
            `Commande de normalisation ${i}:`,
            normalizeCommand.join(" ")
          );

          // Timeout de 60 secondes pour la normalisation
          const normalizePromise = ffmpeg.exec(normalizeCommand);
          const normalizeTimeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Timeout sur la normalisation")),
              60000
            )
          );

          await Promise.race([normalizePromise, normalizeTimeoutPromise]);
          console.log(`Normalisation ${i} terminée`);
        }

        // Vérifier que la normalisation a réussi
        const normalizedData = await ffmpeg.readFile(`video${i}.mp4`);
        const normalizedArray =
          normalizedData instanceof Uint8Array
            ? normalizedData
            : new Uint8Array();
        console.log(
          `Taille vidéo ${i} normalisée:`,
          normalizedArray.byteLength,
          "bytes"
        );

        if (normalizedArray.byteLength === 0) {
          throw new Error(`Échec de la normalisation de la vidéo ${i}`);
        }
      }

      if (musicFile) {
        console.log(`Écriture du fichier musique: ${musicFile.name}`);
        await ffmpeg.writeFile("music.mp3", await fetchFile(musicFile.file));
      }

      if (voiceFile) {
        console.log(`Écriture du fichier voix: ${voiceFile.name}`);
        await ffmpeg.writeFile("voice.mp3", await fetchFile(voiceFile.file));
      }

      // Lister les fichiers dans FFmpeg pour vérifier
      const files = await ffmpeg.listDir("/");
      console.log("Fichiers disponibles dans FFmpeg:", files);

      // Approche simplifiée : traiter d'abord les vidéos, puis l'audio
      let command: string[] = [];

      if (videoFiles.length === 1) {
        // Une seule vidéo
        command = ["-i", "video0.mp4"];

        if (musicFile && voiceFile) {
          // Vidéo + musique + voix
          command.push("-i", "music.mp3", "-i", "voice.mp3");
          command.push(
            "-filter_complex",
            "[1:a]volume=0.3[music];[2:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=longest[audio]"
          );
          command.push("-map", "0:v", "-map", "[audio]");
        } else if (musicFile) {
          // Vidéo + musique seulement
          command.push("-i", "music.mp3");
          command.push("-filter_complex", "[1:a]volume=0.3[audio]");
          command.push("-map", "0:v", "-map", "[audio]");
        } else if (voiceFile) {
          // Vidéo + voix seulement
          command.push("-i", "voice.mp3");
          command.push("-filter_complex", "[1:a]volume=1.0[audio]");
          command.push("-map", "0:v", "-map", "[audio]");
        } else {
          // Vidéo seulement
          command.push("-map", "0:v", "-map", "0:a");
        }
      } else {
        // Plusieurs vidéos - d'abord les concaténer
        console.log("Concaténation de", videoFiles.length, "vidéos");

        // Étape 1: Concaténer les vidéos d'abord
        const concatCommand = [];
        for (let i = 0; i < videoFiles.length; i++) {
          concatCommand.push("-i", `video${i}.mp4`);
        }

        const videoInputs = videoFiles
          .map((_, i) => `[${i}:v][${i}:a]`)
          .join("");
        concatCommand.push(
          "-filter_complex",
          `${videoInputs}concat=n=${videoFiles.length}:v=1:a=1[outv][outa]`
        );
        concatCommand.push("-map", "[outv]", "-map", "[outa]");
        concatCommand.push("-c:v", "libx264", "-c:a", "aac");
        concatCommand.push("temp_concat.mp4");

        console.log("Commande de concaténation:", concatCommand.join(" "));

        // Activer les logs FFmpeg pour voir l'erreur
        ffmpeg.on("log", ({ message }) => {
          console.log("FFmpeg log:", message);
        });

        try {
          await ffmpeg.exec(concatCommand);
        } catch (concatError) {
          console.error("Erreur lors de la concaténation:", concatError);

          // Essayer une approche alternative avec des fichiers plus simples
          console.log("Tentative avec approche alternative...");
          const altCommand = [
            "-i",
            "video0.mp4",
            "-i",
            "video1.mp4",
            "-filter_complex",
            "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]",
            "-map",
            "[outv]",
            "-map",
            "[outa]",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "temp_concat.mp4",
          ];

          console.log("Commande alternative:", altCommand.join(" "));
          await ffmpeg.exec(altCommand);
        }

        // Vérifier que la concaténation a fonctionné
        let tempData;
        try {
          tempData = await ffmpeg.readFile("temp_concat.mp4");
        } catch (readError) {
          console.error(
            "Impossible de lire temp_concat.mp4, essai avec approche file list..."
          );

          // Approche avec file list (plus robuste)
          const fileListContent = videoFiles
            .map((_, i) => `file 'video${i}.mp4'`)
            .join("\n");
          await ffmpeg.writeFile("filelist.txt", fileListContent);

          const fileListCommand = [
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            "filelist.txt",
            "-c",
            "copy",
            "temp_concat.mp4",
          ];

          console.log("Commande file list:", fileListCommand.join(" "));
          await ffmpeg.exec(fileListCommand);

          tempData = await ffmpeg.readFile("temp_concat.mp4");
        }

        const tempArray =
          tempData instanceof Uint8Array ? tempData : new Uint8Array();
        console.log("Taille vidéo concaténée:", tempArray.byteLength, "bytes");

        if (tempArray.byteLength === 0) {
          throw new Error(
            "Échec de la concaténation des vidéos - toutes les méthodes ont échoué"
          );
        }

        // Maintenant utiliser la vidéo concaténée comme base
        command = ["-i", "temp_concat.mp4"];

        if (musicFile && voiceFile) {
          command.push("-i", "music.mp3", "-i", "voice.mp3");
          command.push(
            "-filter_complex",
            "[1:a]volume=0.3[music];[2:a]volume=1.0[voice];[music][voice]amix=inputs=2:duration=longest[audio]"
          );
          command.push("-map", "0:v", "-map", "[audio]");
        } else if (musicFile) {
          command.push("-i", "music.mp3");
          command.push(
            "-filter_complex",
            "[0:a][1:a]amix=inputs=2:duration=longest:weights=1 0.3[audio]"
          );
          command.push("-map", "0:v", "-map", "[audio]");
        } else if (voiceFile) {
          command.push("-i", "voice.mp3");
          command.push(
            "-filter_complex",
            "[0:a][1:a]amix=inputs=2:duration=longest:weights=1 1.0[audio]"
          );
          command.push("-map", "0:v", "-map", "[audio]");
        } else {
          command.push("-c", "copy");
        }
      }

      command.push("-c:v", "libx264", "-c:a", "aac", "-shortest", "output.mp4");

      console.log("Commande FFmpeg:", command.join(" "));

      // Exécuter FFmpeg
      await ffmpeg.exec(command);
      console.log("Compilation FFmpeg terminée");

      // Lire le résultat
      const data = await ffmpeg.readFile("output.mp4");
      const dataArray = data instanceof Uint8Array ? data : new Uint8Array();
      console.log(
        "Taille du fichier de sortie:",
        dataArray.byteLength,
        "bytes"
      );

      if (dataArray.byteLength === 0) {
        throw new Error(
          "Le fichier de sortie est vide. La compilation a échoué."
        );
      }

      const blob = new Blob([data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      setOutputUrl(url);
      console.log("Vidéo compilée avec succès");
    } catch (error) {
      console.error("Erreur lors de la compilation:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Erreur lors de la compilation: ${errorMessage}`);
      setOutputUrl(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Télécharger la vidéo
  const downloadVideo = () => {
    if (outputUrl) {
      const a = document.createElement("a");
      a.href = outputUrl;
      a.download = "video_compilee.mp4";
      a.click();
    }
  };

  return (
    <div className="video-editor-tab">
      <h2>🎬 Éditeur Vidéo</h2>

      {!isLoaded ? (
        <div className="loading">
          <p>Chargement de l'éditeur vidéo...</p>
        </div>
      ) : !ffmpeg ? (
        <div className="error">
          <p>❌ Erreur: Impossible de charger l'éditeur vidéo.</p>
          <p>
            Veuillez vérifier que votre navigateur supporte WebAssembly et
            recharger la page.
          </p>
          <button onClick={() => window.location.reload()}>
            🔄 Recharger la page
          </button>
        </div>
      ) : (
        <div className="editor-container">
          {/* Section de sélection des fichiers */}
          <div className="file-selection">
            <h3>📁 Sélection des fichiers</h3>

            {/* Vidéos */}
            <div className="file-section">
              <label>Vidéos (MP4 recommandé)</label>
              <input
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleVideoFiles}
                style={{ display: "none" }}
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                className="file-btn"
              >
                📹 Choisir des vidéos
              </button>

              {videoFiles.length > 0 && (
                <div className="file-list">
                  {videoFiles.map((video, index) => (
                    <div key={index} className="file-item">
                      <span>{video.name}</span>
                      <button
                        onClick={() => removeVideoFile(index)}
                        className="remove-btn"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Musique de fond */}
            <div className="file-section">
              <label>Musique de fond (MP3)</label>
              <input
                ref={musicInputRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicFile}
                style={{ display: "none" }}
              />
              <button
                onClick={() => musicInputRef.current?.click()}
                className="file-btn"
              >
                🎵 Choisir une musique
              </button>

              {musicFile && (
                <div className="file-item">
                  <span>{musicFile.name}</span>
                  <button onClick={removeMusicFile} className="remove-btn">
                    ❌
                  </button>
                </div>
              )}
            </div>

            {/* Voix off */}
            <div className="file-section">
              <label>Voix off (MP3)</label>
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*"
                onChange={handleVoiceFile}
                style={{ display: "none" }}
              />
              <button
                onClick={() => voiceInputRef.current?.click()}
                className="file-btn"
              >
                🎤 Choisir une voix
              </button>

              {voiceFile && (
                <div className="file-item">
                  <span>{voiceFile.name}</span>
                  <button onClick={removeVoiceFile} className="remove-btn">
                    ❌
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bouton de compilation */}
          <div className="compile-section">
            <button
              onClick={compileVideo}
              disabled={isProcessing || videoFiles.length === 0}
              className="compile-btn"
            >
              {isProcessing
                ? "🔄 Compilation en cours..."
                : "🚀 Compiler la vidéo"}
            </button>
          </div>

          {/* Résultat */}
          {outputUrl && (
            <div className="output-section">
              <h3>✅ Vidéo compilée avec succès !</h3>
              <video
                controls
                src={outputUrl}
                style={{ maxWidth: "100%", marginBottom: "1rem" }}
              />
              <button onClick={downloadVideo} className="download-btn">
                💾 Télécharger la vidéo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoEditorTab;
