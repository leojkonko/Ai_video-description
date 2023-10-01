
import { FileVideo, Upload } from "lucide-react";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

export function VideoInputForm(){

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const promptInputRef = useRef<HTMLTextAreaElement>(null)

    async function convertVideoToAudio(video: File){
      console.log('convert startd.')

      const ffmpeg = await getFFmpeg()

      await ffmpeg.writeFile('input.mp4', await fetchFile(video))

      /*ffmpeg.on('log', log => {
        console.log(log)
      })*/

      ffmpeg.on('progress', progress => {
        console.log('convert progress:' + Math.round(progress.progress * 100))
      })
//trnasformar mp4 para mp3
      await ffmpeg.exec([
        '-i',
        'input.mp4',
        '-map',
        '0:a',
        '-b:a',
        '20k',
        '-acodec',
        'libmp3lame',
        'output.mp3'
      ])

      //ler arquivo mp3

      const data = await ffmpeg.readFile('output.mp3')

      const audioFileBlob = new Blob([data], {type: 'audio/mpeg'})

      const audioFile = new File([audioFileBlob], 'audio.mp3', {
        type: 'audio/mpeg'
      })

      console.log('convert finished')
    
      return audioFile
    }

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>){
      const { files } = event.currentTarget

      if(!files){
        return
      }

      const selectedFile = files[0]

      setVideoFile(selectedFile)
    }

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>) { 
      event.preventDefault()

      const prompt = promptInputRef.current?.value

      if(!videoFile){
        return 
      }

      // converter o vídeo em áudio
      const audioFile = await convertVideoToAudio(videoFile)

      console.log(audioFile)//File {name: 'audio.mp3', lastModified: 1696201575483, lastModifiedDate: Sun Oct 01 2023 20:06:15 GMT-0300 (Horário Padrão de Brasília), webkitRelativePath: '', size: 2631190, …}
    }

    const previewURL = useMemo(() => {
      if (!videoFile){
        return null
      }

      return URL.createObjectURL(videoFile)

    }, [videoFile])

    return(
    <form onSubmit={handleUploadVideo} className="space-y-6 w-full" action="">
    <label htmlFor="video" 
    className="relative cursor-pointer border w-full flex rounded-md aspect-video border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5">
      {previewURL ? (
        <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
      ) : (
        <>
          <FileVideo className="w-4 h-4" />
          Selecione um vídeo
        </>
      )}
    </label>
    <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

    <Separator />

    <div className="space-y-2">
      <Label htmlFor="transcription-prompt">Prompt de transcrição</Label>
      <Textarea id="transcription-prompt" className="h-20 resize-none leading-relaxed" ref={promptInputRef}
      placeholder="Inclua palavras chave mencionadas no vídeo separadas por vírgula (,)" />
    </div>
    <Button type="submit" className="w-full">Carregar Vídeo
      <Upload className="h-4w-4 ml-2" />
    </Button>
  </form>
  )
}