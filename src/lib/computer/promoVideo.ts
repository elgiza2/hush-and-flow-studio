import { z } from "zod";

export const promoInput = z.object({
  images: z.array(z.string().url().regex(/^https:\/\//)).min(1).max(12),
  captions: z.array(z.string().max(80)).max(12).default([]),
  seconds_per_slide: z.number().min(1).max(8).default(3),
  music_url: z.string().url().regex(/^https:\/\//).optional(),
});

/** Python run inside the isolated computer: downloads images, zoom-pans each with its caption, joins and adds music. */
export function promoVideoScript(raw: unknown) {
  const a = promoInput.parse(raw);
  return `import json,subprocess,urllib.request,os
a=json.loads(${JSON.stringify(JSON.stringify(a))})
os.makedirs('/home/user/promo',exist_ok=True)
d=a['seconds_per_slide'];parts=[]
for i,u in enumerate(a['images']):
  src=f'/home/user/promo/{i}.img';urllib.request.urlretrieve(u,src)
  cap=(a['captions'][i] if i<len(a['captions']) else '').replace("'","\\u2019").replace(':','\\\\:')
  open(f'/home/user/promo/{i}.txt','w').write(cap)
  vf=f"scale=1296:2304:force_original_aspect_ratio=increase,crop=1296:2304,zoompan=z='min(zoom+0.0015,1.2)':d={int(d*30)}:s=1080x1920:fps=30"
  if cap: vf+=f",drawbox=y=ih-420:w=iw:h=260:color=black@0.45:t=fill,drawtext=textfile=/home/user/promo/{i}.txt:fontcolor=white:fontsize=64:x=(w-text_w)/2:y=h-330"
  out=f'/home/user/promo/{i}.mp4';parts.append(out)
  subprocess.run(['ffmpeg','-y','-loop','1','-i',src,'-t',str(d),'-vf',vf,'-pix_fmt','yuv420p','-c:v','libx264',out],check=True,capture_output=True)
open('/home/user/promo/list.txt','w').write(''.join(f"file '{p}'\\n" for p in parts))
subprocess.run(['ffmpeg','-y','-f','concat','-safe','0','-i','/home/user/promo/list.txt','-c','copy','/home/user/promo/silent.mp4'],check=True,capture_output=True)
if a.get('music_url'):
  urllib.request.urlretrieve(a['music_url'],'/home/user/promo/music')
  subprocess.run(['ffmpeg','-y','-i','/home/user/promo/silent.mp4','-i','/home/user/promo/music','-shortest','-c:v','copy','-c:a','aac','-af','volume=0.6','/home/user/promo.mp4'],check=True,capture_output=True)
else: os.replace('/home/user/promo/silent.mp4','/home/user/promo.mp4')
print(json.dumps({'path':'/home/user/promo.mp4','slides':len(parts),'seconds':len(parts)*d}))`;
}
