"use client";
// ══════════════════════════════════════════════════════════════
//  PORTFOLIO GAME — Level 1-1 with Skill Reveals
//  Every coin / Q-block reveals a real skill from the resume
//  Controls: ← → / A D   |   Space / W / ↑ = Jump   |   M = Mute
// ══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback } from "react";
import { AudioEngine } from "./AudioEngine";

// ── Constants ─────────────────────────────────────────────────
const T     = 32;
const CVW   = 920;
const CVH   = 552;
const LW    = 255;
const LH    = 15;
const GRAV  = 0.55;       // tighter gravity
const MAXFY = 14;
const JUMPV = -12.5;
const WALKV = 3.0;
const RUNV  = 5.2;
const ACCEL = 0.38;       // smooth acceleration
const DECEL = 0.88;       // smooth deceleration
const AIR_ACCEL = 0.25;   // air control

// Tile IDs
const AIR=0, GND=1, BRK=2, QBK=3, PTL=4, PTR=5, PML=6, PMR=7, EBK=8;
const isSolid = (t:number) => t===GND||t===BRK||t===QBK||t===EBK||t===PML||t===PMR||t===PTL||t===PTR;

// ── Character colors (purple / teal — NOT Mario's red/blue) ──
const CHAR = {
  hat:    '#7B2FBE',   // purple
  hatDark:'#5A1E96',
  shirt:  '#00B4A0',   // teal
  shirtDk:'#008C7A',
  skin:   '#FFD5A0',
  skinDk: '#E8B878',
  hair:   '#3A1A00',
  shoes:  '#2D1560',
  buckle: '#FFD700',
};

// ── SKILLS that pop out of Q-blocks & coins ───────────────────
const SKILLS = [
  "HTML & CSS", "JAVASCRIPT", "REACT", "NEXT.JS", "TAILWIND CSS",
  "TYPESCRIPT", "NODE.JS", "PYTHON", "C++", "GIT",
  "UI/UX DESIGN", "FIGMA", "ADOBE XD", "WIREFRAMING", "PROTOTYPING",
  "DESIGN SYSTEMS", "USER RESEARCH", "RESPONSIVE DESIGN", "TYPOGRAPHY", "COLOR THEORY",
  "PHOTOSHOP", "ILLUSTRATOR", "AFTER EFFECTS", "PREMIERE PRO", "MOTION GRAPHICS",
  "BLENDER", "3D MODELING", "LUMION", "AUTOCAD", "RENDERING",
  "BRANDING", "LOGO DESIGN", "GRAPHIC DESIGN", "CREATIVE DIRECTION", "VISUAL IDENTITY",
  "VS CODE", "SASS & SCSS", "THREE.JS", "ANIMATION", "PROBLEM SOLVING",
];
let skillIdx = 0;
function nextSkill(): string {
  const s = SKILLS[skillIdx % SKILLS.length];
  skillIdx++;
  return s;
}

const SKILL_COLORS: Record<string, string> = {
  "FIGMA":"#f24e1e","PHOTOSHOP":"#31a8ff","ILLUSTRATOR":"#ff9a00",
  "AFTER EFFECTS":"#9999ff","PREMIERE PRO":"#ea77ff","ADOBE XD":"#ff61f6",
  "HTML & CSS":"#e34f26","JAVASCRIPT":"#f7df1e","REACT":"#61dafb",
  "NEXT.JS":"#ffffff","BLENDER":"#ea7600","3D MODELING":"#00c4b4",
  "UI/UX DESIGN":"#f24e1e","MOTION GRAPHICS":"#ff6b6b","AUTOCAD":"#c4302b",
  "LUMION":"#6ec1e4","BRANDING":"#fbd000","LOGO DESIGN":"#43b047",
  "WIREFRAMING":"#888","PROTOTYPING":"#049cd8","DESIGN SYSTEMS":"#e52521",
  "USER RESEARCH":"#43b047","TYPOGRAPHY":"#f0f0f0","COLOR THEORY":"#ff69b4",
  "C++":"#00599c","PYTHON":"#3776ab","NODE.JS":"#339933",
  "TAILWIND CSS":"#06b6d4","GIT":"#f05032","VS CODE":"#007acc",
  "TYPESCRIPT":"#3178c6","RESPONSIVE DESIGN":"#ff6b6b","RENDERING":"#ea7600",
  "GRAPHIC DESIGN":"#ff69b4","CREATIVE DIRECTION":"#d4a5ff","VISUAL IDENTITY":"#fbd000",
  "SASS & SCSS":"#cc6699","THREE.JS":"#049cd8","ANIMATION":"#43b047",
  "PROBLEM SOLVING":"#fbd000",
};

// ── Types ─────────────────────────────────────────────────────
interface Hero {
  x:number;y:number;vx:number;vy:number;w:number;h:number;
  onGround:boolean;facing:1|-1;running:boolean;
  dead:boolean;deadTimer:number;
  animFrame:number;animTimer:number;
  exiting?:boolean;
  state?: 'small'|'big';
  invincibleTimer?:number;
  pipeState?: 'none' | 'entering' | 'exiting_underground' | 'entering_right' | 'emerging_overworld';
  pipeTimer?: number;
}
interface Enemy {
  x:number;y:number;vx:number;vy:number;w:number;h:number;
  onGround:boolean;alive:boolean;squished:boolean;squishTimer:number;
  animFrame:number;animTimer:number;
}
interface PowerUp {
  x:number;y:number;vx:number;vy:number;w:number;h:number;
  onGround:boolean;type:'mushroom';active:boolean;animTimer:number;
}
interface Coin {
  x:number;y:number;collected:boolean;animT:number;skill:string;
}
interface SkillPop {
  x:number;y:number;vy:number;life:number;maxLife:number;
  skill:string;color:string;scale:number;
}
interface ScorePop {
  x:number;y:number;val:number;life:number;
}
interface BlockInfo {
  tx:number; ty:number; hit:boolean; hitTimer:number; skill:string; item?:string;
}
interface BrickDebris {
  x:number; y:number; vx:number; vy:number; life:number;
}

// Phase removed 'intro'
type Phase = 'title'|'playing'|'dead'|'clear'|'win'|'gameover'|'respawn_screen'|'paused';

interface GS {
  mario:Hero; goombas:Enemy[]; blocks:BlockInfo[];
  coins:Coin[]; skillPops:SkillPop[]; scorePops:ScorePop[]; powerups:PowerUp[]; brickDebris:BrickDebris[];
  camX:number; score:number; coinCount:number;
  lives:number; time:number; timeAccum:number;
  phase:Phase;
  tiles:number[][]; revealedSkills:string[];
  frameCount:number;
  winTimer?:number;
  fireworks?:{x:number, y:number, life:number, maxLife:number, color:string}[];
  respawnTimer?:number;
  flagY?:number;
  underground: boolean;
}

// ── Level Builder ─────────────────────────────────────────────
function buildLevel() {
  const t:number[][] = Array.from({length:LH}, ()=>new Array(LW).fill(AIR));
  const set=(x:number,y:number,v:number)=>{if(x>=0&&x<LW&&y>=0&&y<LH)t[y][x]=v;};
  const row=(y:number,x0:number,x1:number,v:number)=>{for(let x=x0;x<=x1;x++)set(x,y,v);};
  const col=(x:number,y0:number,y1:number,v:number)=>{for(let y=y0;y<=y1;y++)set(x,y,v);};
  const putPipe=(x:number,y:number,h:number)=>{
    set(x,y-h,PTL); set(x+1,y-h,PTR);
    col(x,y-h+1,y-1,PML); col(x+1,y-h+1,y-1,PMR);
  };
  const putWall=(x:number,y:number,h:number)=>{
    col(x,y-h,y-1,BRK);
  };

  // Ground
  [[0,69],[71,86],[89,153],[155,212]].forEach(([x0,x1])=>{
    row(12,x0,x1,GND); row(13,x0,x1,GND); row(14,x0,x1,GND);
  });

  // Interactable Terrain
  set(16, 8, QBK); 
  set(20, 8, BRK); set(21, 8, QBK); set(22, 8, BRK); set(23, 8, QBK); set(24, 8, BRK);
  set(22, 4, QBK);
  putPipe(28, 12, 2);
  putPipe(38, 12, 3);
  putPipe(46, 12, 4);
  putPipe(57, 12, 4); // "DOWN" pipe
  
  set(77, 8, BRK); set(78, 8, QBK); set(79, 8, BRK);
  row(4, 80, 87, BRK);
  row(4, 91, 93, BRK); set(94, 4, QBK);
  set(94, 8, BRK);
  
  set(100, 8, BRK); set(101, 8, BRK);
  set(105, 8, QBK);
  set(108, 8, QBK); set(108, 4, QBK);
  set(111, 8, QBK);
  set(117, 8, BRK);
  row(4, 120, 123, BRK);
  row(4, 128, 130, BRK); set(129, 4, QBK); set(130, 4, QBK);
  set(129, 8, BRK); set(130, 8, BRK);
  set(131, 4, BRK);
  
  putWall(134, 12, 1); putWall(135, 12, 2); putWall(136, 12, 3); putWall(137, 12, 4);
  putWall(140, 12, 4); putWall(141, 12, 3); putWall(142, 12, 2); putWall(143, 12, 1);
  putWall(148, 12, 1); putWall(149, 12, 2); putWall(150, 12, 3); putWall(151, 12, 4); putWall(152, 12, 4);
  putWall(155, 12, 4); putWall(156, 12, 3); putWall(157, 12, 2); putWall(158, 12, 1);
  
  putPipe(163, 12, 2);
  set(168, 8, BRK); set(169, 8, BRK); set(170, 8, QBK); set(171, 8, BRK);
  putPipe(179, 12, 2);
  
  putWall(181, 12, 1); putWall(182, 12, 2); putWall(183, 12, 3); putWall(184, 12, 4);
  putWall(185, 12, 5); putWall(186, 12, 6); putWall(187, 12, 7); putWall(188, 12, 8); putWall(189, 12, 8);
  
  set(198, 11, BRK); // base block for flag

  // ── Underground Coin Room ──
  // Floor
  row(12, 222, 252, GND);
  row(13, 222, 252, GND);
  row(14, 222, 252, GND);

  // Borders (left wall, ceiling, right wall)
  col(224, 2, 11, BRK);
  row(2, 224, 251, BRK);
  col(251, 2, 11, BRK);

  // Ceiling entrance pipe
  set(226, 3, PML); set(227, 3, PMR);
  set(226, 4, PTL); set(227, 4, PTR);

  // Exit pipe
  set(247, 9, PTL); set(248, 9, PTR);
  col(247, 10, 11, PML); col(248, 10, 11, PMR);

  // Two-tiered brick platforms
  row(9, 232, 241, BRK);
  row(6, 234, 239, BRK);

  return t;
}

function extractBlocks(tiles:number[][]): BlockInfo[] {
  const blocks:BlockInfo[]=[];
  for(let y=0;y<LH;y++)
    for(let x=0;x<LW;x++)
      if(tiles[y][x]===QBK) {
        let item = 'coin';
        if((x===21&&y===8) || (x===78&&y===8) || (x===108&&y===4)) item = 'mushroom';
        blocks.push({tx:x,ty:y,hit:false,hitTimer:0,skill:item==='mushroom'?'':nextSkill(), item});
      }
  return blocks;
}

function makeCoins(): Coin[] {
  const coins: Coin[] = [];
  // Overworld floating coins — scattered across the level for skill reveals
  const overworldPositions = [
    [10,9],[12,9],[14,9],         // early area
    [33,9],[34,9],                 // between pipes
    [43,7],[44,7],                 // mid pipes area
    [63,9],[64,9],                 // after last pipe
    [75,7],                        // after first gap
    [96,7],[97,7],                 // mid level
    [160,9],[161,9],               // near end
  ];
  overworldPositions.forEach(([tx,ty])=>{
    coins.push({
      x: tx * T + 4,
      y: ty * T,
      collected: false,
      animT: Math.random() * 100,
      skill: nextSkill()
    });
  });
  // Underground: lower platform stacked coins (two rows: y = 8 and y = 7)
  for (let x = 232; x <= 241; x++) {
    for (let yOffset = 0; yOffset < 2; yOffset++) {
      coins.push({
        x: x * T + 4,
        y: (8 - yOffset) * T,
        collected: false,
        animT: Math.random() * 100,
        skill: nextSkill()
      });
    }
  }
  // Underground: upper platform stacked coins (two rows: y = 5 and y = 4)
  for (let x = 234; x <= 239; x++) {
    for (let yOffset = 0; yOffset < 2; yOffset++) {
      coins.push({
        x: x * T + 4,
        y: (5 - yOffset) * T,
        collected: false,
        animT: Math.random() * 100,
        skill: nextSkill()
      });
    }
  }
  return coins;
}

function makeEnemies(): Enemy[] {
  const pos=[
    [22, 11], [40, 11], [50, 11], [51, 11], [82, 3], [84, 3],
    [100, 11], [102, 11], [114, 11], [115, 11], [122, 11], [123, 11],
    [125, 11], [126, 11], [170, 11], [172, 11], [35, 11]
  ];
  return pos.map(([x,y])=>({
    x:x*T,y:y*T,vx:-1.0,vy:0,w:28,h:28,
    onGround:false,alive:true,squished:false,squishTimer:0,
    animFrame:0,animTimer:0,
  }));
}

function initState(): GS {
  skillIdx = 0;
  const tiles = buildLevel();
  return {
    mario:{x:2*T,y:10*T,vx:0,vy:0,w:26,h:30,onGround:false,facing:1,running:false,dead:false,deadTimer:0,animFrame:0,animTimer:0,state:'small'},
    goombas:makeEnemies(),
    blocks:extractBlocks(tiles),
    coins:makeCoins(),
    skillPops:[],scorePops:[],powerups:[],brickDebris:[],
    camX:0,score:0,coinCount:0,lives:3,time:400,timeAccum:0,
    phase:'title',tiles,revealedSkills:[],frameCount:0,
    flagY:3*T,
    underground: false,
  };
}

// ── Collision ─────────────────────────────────────────────────
function tileAt(tiles:number[][],px:number,py:number):number{
  const tx=Math.floor(px/T),ty=Math.floor(py/T);
  if(tx<0||tx>=LW||ty<0||ty>=LH) return ty<0?AIR:GND;
  return tiles[ty][tx];
}

function resolveVsWorld(
  tiles:number[][],e:{x:number;y:number;vx:number;vy:number;w:number;h:number;onGround:boolean},
  onHeadHit?:(tx:number,ty:number)=>void
){
  const{w,h}=e;
  // Horizontal
  e.x+=e.vx;
  if(e.vx>0){
    const collides = isSolid(tileAt(tiles,e.x+w,e.y+4)) || 
                     isSolid(tileAt(tiles,e.x+w,e.y+h/2)) || 
                     isSolid(tileAt(tiles,e.x+w,e.y+h-2));
    if(collides){
      e.x=Math.floor((e.x+w)/T)*T-w-0.01; e.vx=0;
    }
  }else if(e.vx<0){
    const collides = isSolid(tileAt(tiles,e.x,e.y+4)) || 
                     isSolid(tileAt(tiles,e.x,e.y+h/2)) || 
                     isSolid(tileAt(tiles,e.x,e.y+h-2));
    if(collides){
      e.x=Math.floor(e.x/T)*T+T+0.01; e.vx=0;
    }
  }
  // Vertical
  e.y+=e.vy; e.onGround=false;
  if(e.vy>0){
    if(isSolid(tileAt(tiles,e.x+3,e.y+h)) || 
       isSolid(tileAt(tiles,e.x+w/2,e.y+h)) || 
       isSolid(tileAt(tiles,e.x+w-3,e.y+h))){
      e.y=Math.floor((e.y+h)/T)*T-h; e.vy=0; e.onGround=true;
    }
  }else if(e.vy<0){
    const ty=Math.floor(e.y/T);
    if(isSolid(tileAt(tiles,e.x+3,e.y)) || 
       isSolid(tileAt(tiles,e.x+w/2,e.y)) || 
       isSolid(tileAt(tiles,e.x+w-3,e.y))){
      e.y=(ty+1)*T; e.vy=0;
      if(onHeadHit){
        const tx1=Math.floor((e.x+3)/T);
        onHeadHit(tx1,ty);
        const tx2=Math.floor((e.x+w-3)/T);
        if(tx2!==tx1) onHeadHit(tx2,ty);
        const tx3=Math.floor((e.x+w/2)/T);
        if(tx3!==tx1 && tx3!==tx2) onHeadHit(tx3,ty);
      }
    }
  }
  if(e.x<0){e.x=0;e.vx=0;}
  if(e.x+w>LW*T){e.x=LW*T-w;e.vx=0;}
}

function aabb(a:{x:number;y:number;w:number;h:number},b:{x:number;y:number;w:number;h:number}){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

interface Keys{left:boolean;right:boolean;jump:boolean;run:boolean;jumpHeld:boolean;[key: string]: boolean;}

// ── Update ────────────────────────────────────────────────────
function update(gs:GS, keys:Keys, audio:AudioEngine){
  const{mario,tiles,blocks,coins,goombas}=gs;
  gs.frameCount++;

  // PAUSED phase — do nothing
  if(gs.phase==='paused'){
    return;
  }

  if(gs.phase==='clear'){
    mario.animFrame = 5; // cling to pole
    
    // Slide flag down while Mario waits
    if(gs.flagY !== undefined && gs.flagY < 10*T) {
      gs.flagY += 2.5; 
      mario.vy = 0;
    } else {
      if(!mario.exiting) {
        audio.sfxFlagpole(); // Play music when flag reaches bottom
        mario.exiting = true;
      }
      
      // Mario hops off the pole immediately after flag drops
      if (mario.x <= 198*T) {
        mario.x = 198*T + 16;
        mario.vy = -3;
        mario.y = 11*T - mario.h;
      }
      
      mario.vy = Math.min(mario.vy + GRAV, MAXFY);
      mario.y += mario.vy;
      
      if (mario.y >= 12*T - mario.h) {
        mario.y = 12*T - mario.h;
        mario.vy = 0;
        mario.vx = 0.8;
        mario.x += mario.vx;
        mario.animTimer++;
        if(mario.animTimer >= 8){ mario.animTimer=0; mario.animFrame=(mario.animFrame+1)%4; }
      }
      
      // If reached castle door
      if(mario.x > 204*T) {
        gs.phase = 'win';
        gs.winTimer = 0;
        gs.fireworks = [];
        gs.score += gs.time*10;
        mario.dead = true; // hide mario
        audio.sfxStageClear();
      }
    }
    // Camera follow slightly
    const tcx=mario.x-CVW/3;
    gs.camX+=(tcx-gs.camX)*0.08;
    gs.camX=Math.max(0,Math.min(gs.camX,LW*T-CVW));
    return;
  }

  if(gs.phase==='win'){
    if(gs.winTimer !== undefined && gs.fireworks !== undefined) {
      gs.winTimer++;
      if(gs.winTimer > 350 && gs.winTimer % 50 === 0 && gs.winTimer <= 600) {
        const fwColors = ['#fbd000', '#049cd8', '#43b047', '#ff69b4', '#fff'];
        const col = fwColors[Math.floor(Math.random() * fwColors.length)];
        gs.fireworks.push({
          x: 203*T + (Math.random() * 100 - 50),
          y: 4*T + (Math.random() * 100 - 50),
          life: 40, maxLife: 40, color: col
        });
        audio.sfxFireworks();
        gs.score += 500;
      }
      gs.fireworks.forEach(f => f.life--);
      gs.fireworks = gs.fireworks.filter(f => f.life > 0);
    }
    return;
  }

  if(gs.phase==='dead'){
    mario.deadTimer++;
    if(mario.deadTimer===30){
      mario.vy = -7.5; // Hop up after 30 frames freeze
    }
    if(mario.deadTimer>30){
      mario.vy += 0.4; // Custom death gravity
      mario.y += mario.vy;
    }
    if(mario.deadTimer>180){ // ~3 seconds delay before transitioning
      gs.lives--;
      if(gs.lives<=0){
        gs.phase='gameover';
        audio.sfxGameOver();
        return;
      }
      const fresh=initState();fresh.lives=gs.lives;fresh.score=gs.score;
      fresh.coinCount=gs.coinCount;fresh.revealedSkills=[...gs.revealedSkills];
      fresh.phase='respawn_screen';
      fresh.respawnTimer=0;
      Object.assign(gs,fresh);
    }
    return;
  }

  if(gs.phase==='respawn_screen'){
    gs.respawnTimer = (gs.respawnTimer||0) + 1;
    if(gs.respawnTimer > 150){
      gs.phase='playing';
      audio.startMusic(gs.underground ? 'underground' : 'overworld');
    }
    return;
  }
  if(gs.phase!=='playing') return;

  // ── Pipe transitions ──────────────────────────────────────────
  if (mario.pipeState && mario.pipeState !== 'none') {
    mario.pipeTimer = (mario.pipeTimer || 0) + 1;
    if (mario.pipeState === 'entering') {
      mario.vx = 0;
      mario.vy = 0;
      mario.y += 0.8; // sink down slowly
      if (mario.pipeTimer >= 50) {
        // Teleport to underground!
        gs.underground = true;
        mario.x = 226 * T + 4; // center of ceiling pipe
        mario.y = 2 * T; // inside ceiling pipe
        mario.pipeState = 'exiting_underground';
        mario.pipeTimer = 0;
      }
    } else if (mario.pipeState === 'exiting_underground') {
      mario.vx = 0;
      mario.vy = 0;
      mario.y += 2.0; // move down out of pipe (96px over 48 frames)
      if (mario.pipeTimer >= 48) {
        mario.pipeState = 'none';
        mario.y = 5 * T; // start falling from bottom of ceiling pipe
        mario.vy = 0.5; // fall normally
        audio.startMusic('underground');
      }
    } else if (mario.pipeState === 'entering_right') {
      mario.vx = 0;
      mario.vy = 0;
      mario.x += 0.8; // move right into pipe
      if (mario.pipeTimer >= 40) {
        // Warp back to overworld!
        gs.underground = false;
        mario.x = 179 * T + 4; // center of overworld exit pipe (closest to pole)
        mario.y = 10 * T; // inside pipe (feet at 10*T + h)
        mario.pipeState = 'emerging_overworld';
        mario.pipeTimer = 0;
        gs.camX = 166 * T; // position camera
      }
    } else if (mario.pipeState === 'emerging_overworld') {
      mario.vx = 0;
      mario.vy = 0;
      mario.y -= mario.h / 40; // rise up slowly
      if (mario.pipeTimer >= 40) {
        mario.pipeState = 'none';
        mario.y = 10 * T - mario.h; // snap exactly to top of pipe!
        mario.vy = 0;
        audio.startMusic('overworld');
      }
    }
    
    // Position camera instantly during pipe transitions
    if (gs.underground) {
      gs.camX = 222 * T;
    } else {
      const tcx = mario.x - CVW/3;
      gs.camX = Math.max(0, Math.min(tcx, 216*T - CVW));
    }
    return; // Skip normal update during pipe transition!
  }

  // ── Overworld Pipe Entrance Trigger ──
  if (!gs.underground && mario.onGround && keys.down) {
    const tx = Math.floor((mario.x + mario.w/2) / T);
    const ty = Math.floor((mario.y + mario.h) / T);
    if ((tx === 57 || tx === 58) && Math.abs(mario.y + mario.h - 8*T) < 4) {
      mario.vx = 0;
      mario.vy = 0;
      mario.pipeState = 'entering';
      mario.pipeTimer = 0;
      audio.sfxPipe();
    }
  }

  // ── Underground Pipe Exit Trigger ──
  if (gs.underground && mario.y >= 10 * T) {
    if (mario.x + mario.w > 247 * T - 8) {
      mario.vx = 0;
      mario.vy = 0;
      mario.pipeState = 'entering_right';
      mario.pipeTimer = 0;
      audio.sfxPipe();
    }
  }

  // Time
  gs.timeAccum+=1/60;
  if(gs.timeAccum>=1){gs.timeAccum=0;gs.time=Math.max(0,gs.time-1);}
  if(gs.time===0){
    mario.dead=true;
    mario.deadTimer=0;
    gs.phase='dead';
    mario.vy=0;
    mario.vx=0;
    audio.sfxDeath();
    return;
  }

  // ── TIGHT PHYSICS ──
  mario.running=keys.run;
  const maxV=mario.running?RUNV:WALKV;
  const acc=mario.onGround?ACCEL:AIR_ACCEL;

  if(keys.right){
    if(mario.vx<0){
      mario.vx=Math.min(mario.vx+0.65,maxV); // skid/brake
    } else {
      mario.vx=Math.min(mario.vx+acc,maxV);
    }
    mario.facing=1;
  } else if(keys.left){
    if(mario.vx>0){
      mario.vx=Math.max(mario.vx-0.65,-maxV); // skid/brake
    } else {
      mario.vx=Math.max(mario.vx-acc,-maxV);
    }
    mario.facing=-1;
  } else {
    // Friction
    if(mario.onGround){
      mario.vx*=0.82; // tighter deceleration
      if(Math.abs(mario.vx)<0.1) mario.vx=0;
    } else {
      mario.vx*=0.96; // air friction
    }
  }

  // Variable-height jump (dynamic gravity)
  if(keys.jump&&mario.onGround){
    mario.vy=JUMPV;
    mario.onGround=false;
    audio.sfxJump();
  }
  
  let currentGrav = GRAV;
  if(mario.vy<0){
    currentGrav = keys.jumpHeld ? GRAV * 0.75 : GRAV * 2.0;
  }
  mario.vy=Math.min(mario.vy+currentGrav,MAXFY);

  // Head-hit → SKILL REVEAL (slow, animated popup) or MUSHROOM
  const headHit=(tx:number,ty:number)=>{
    const tile=tiles[ty][tx];
    if(tile===QBK || tile===BRK){
      const blk=blocks.find(b=>b.tx===tx&&b.ty===ty&&!b.hit);
      if(blk){
        blk.hit=true;blk.hitTimer=12;
        tiles[ty][tx]=EBK;
        
        if(blk.item === 'mushroom') {
          gs.powerups.push({x:tx*T+4, y:ty*T, vx:0, vy:-1, w:24, h:24, onGround:false, type:'mushroom', active:false, animTimer:0});
          audio.sfxSkillReveal(); // Using reveal sfx as powerup spawn
        } else {
          const col=SKILL_COLORS[blk.skill]||'#fbd000';
          // SLOW popup
          gs.skillPops.push({
            x:tx*T+T/2, y:ty*T-16, vy:-0.6, life:220, maxLife:220,
            skill:blk.skill, color:col, scale:0,
          });
          gs.score+=200;gs.coinCount++;
          if(!gs.revealedSkills.includes(blk.skill))gs.revealedSkills.push(blk.skill);
          audio.sfxSkillReveal();
        }
        return; // Handled as skill/item block
      }
    }
    
    if(tile===BRK){
      if(mario.state === 'big') {
        tiles[ty][tx]=AIR;gs.score+=50;
        gs.scorePops.push({x:tx*T+T/2,y:ty*T-8,val:50,life:40});
        for(let di=0;di<4;di++){
          gs.brickDebris.push({
            x:tx*T+(di%2)*14, y:ty*T+Math.floor(di/2)*14,
            vx:(di%2===0?-2.5:2.5)+(Math.random()-0.5),
            vy:-5-Math.random()*3, life:45,
          });
        }
        audio.sfxBlockHit(); // block break sound
      } else {
        audio.sfxBlockHit(); // bump sound
        const blk=blocks.find(b=>b.tx===tx&&b.ty===ty);
        if(!blk) { gs.blocks.push({tx,ty,hit:true,hitTimer:12,skill:''}); }
        else { blk.hitTimer = 12; }
      }
    }
  };

  resolveVsWorld(tiles,mario,headHit);

  // Player bounds clamp
  if (gs.underground) {
    if (mario.x < 224 * T) { mario.x = 224 * T; mario.vx = 0; }
    if (mario.x > 250 * T) { mario.x = 250 * T; mario.vx = 0; }
  } else {
    if (mario.x < gs.camX) { mario.x = gs.camX; if (mario.vx < 0) mario.vx = 0; }
    if (mario.x > 212 * T) { mario.x = 212 * T; mario.vx = 0; }
  }

  // Death by falling
  if(mario.y>CVH+60){
    mario.dead=true;
    mario.deadTimer=0;
    gs.phase='dead';
    mario.vy=0;
    mario.vx=0;
    audio.sfxDeath();
    return;
  }

  // Walk animation
  mario.animTimer++;
  if(mario.onGround&&Math.abs(mario.vx)>0.3){
    const rate=mario.running?4:7;
    if(mario.animTimer>=rate){mario.animTimer=0;mario.animFrame=(mario.animFrame+1)%4;}
  }else if(!mario.onGround){mario.animFrame=5;}
  else{mario.animFrame=0;}

  // Camera (smooth lerp)
  const tcx=mario.x-CVW/3;
  gs.camX+=(tcx-gs.camX)*0.08;
  gs.camX=Math.max(0,Math.min(gs.camX,LW*T-CVW));

  // Enemies
  goombas.forEach(g=>{
    if(!g.alive)return;
    if(g.squished){g.squishTimer--;if(g.squishTimer<=0)g.alive=false;return;}
    g.vy=Math.min(g.vy+GRAV,MAXFY);
    g.animTimer++;if(g.animTimer>12){g.animTimer=0;g.animFrame=1-g.animFrame;}
    resolveVsWorld(tiles,g);
    // Reverse at walls
    if(g.vx===0)g.vx=g.vx===0?(g.animFrame===0?-1.0:1.0):-g.vx;
    // Stomp detection
    if(aabb(mario,g)){
      if(mario.vy>0&&mario.y+mario.h<g.y+14){
        g.squished=true;g.squishTimer=25;
        mario.vy = keys.jumpHeld ? -8.5 : -4.5; // High bounce if holding jump key
        gs.score+=100;
        gs.scorePops.push({x:g.x+g.w/2,y:g.y-10,val:100,life:45});
        audio.sfxStomp();
      }else if(!mario.dead && !(mario.invincibleTimer && mario.invincibleTimer > 0)){
        if(mario.state === 'big') {
          mario.state = 'small';
          mario.y += 26; // adjust height
          mario.h = 30;
          mario.invincibleTimer = 60; // 1 second i-frames
          audio.sfxPipe(); // power down sound
        } else {
          mario.dead=true;
          mario.deadTimer=0;
          gs.phase='dead';
          mario.vy=0;
          mario.vx=0;
          audio.sfxDeath();
        }
      }
    }
  });

  if(mario.invincibleTimer && mario.invincibleTimer > 0) mario.invincibleTimer--;

  // Powerups
  gs.powerups.forEach(p => {
    if(p.animTimer < 24) {
      p.animTimer++;
      p.y -= 1; // rise up out of block
    } else {
      p.active = true;
      p.vy = Math.min(p.vy + GRAV, MAXFY);
      if(p.vx === 0) p.vx = 1.0; // move right
      resolveVsWorld(tiles, p);
      if(p.vx === 0) p.vx = (p.animTimer%2===0) ? -1.0 : 1.0; // wall bounce
    }
    
    if(p.active && aabb(mario, p)) {
      p.active = false;
      p.type = 'used' as any;
      if(mario.state === 'small') {
        mario.state = 'big';
        mario.y -= 26;
        mario.h = 56;
        audio.sfxPowerup(); 
      }
      gs.score += 1000;
      gs.scorePops.push({x:p.x, y:p.y-10, val:1000, life:45});
    }
  });
  gs.powerups = gs.powerups.filter(p => (p.type as any) !== 'used');

  // Coins → SKILL REVEAL (slow popup)
  coins.forEach(c=>{
    if(c.collected)return;
    c.animT+=1;
    const cb={x:c.x,y:c.y+2,w:24,h:24};
    if(aabb(mario,cb)){
      c.collected=true;gs.coinCount++;gs.score+=200;
      const col=SKILL_COLORS[c.skill]||'#fbd000';
      gs.skillPops.push({
        x:c.x+12, y:c.y-16, vy:-0.5, life:200, maxLife:200,
        skill:c.skill, color:col, scale:0,
      });
      if(!gs.revealedSkills.includes(c.skill))gs.revealedSkills.push(c.skill);
      audio.sfxCoin();
    }
  });

  // ── SLOW skill pop update ──
  gs.skillPops.forEach(p=>{
    // Gentle float up with slight deceleration
    p.y+=p.vy;
    p.vy*=0.995; // slowly decelerates
    p.life--;
    // Scale animation: grows in first 30 frames, stays, fades last 40 frames
    const age=p.maxLife-p.life;
    if(age<30) p.scale=Math.min(1, age/30); // ease in
    else p.scale=1;
  });
  gs.skillPops=gs.skillPops.filter(p=>p.life>0);

  gs.scorePops.forEach(p=>{p.y-=0.5;p.life--;});
  gs.scorePops=gs.scorePops.filter(p=>p.life>0);
  gs.brickDebris.forEach(d=>{d.vy+=0.4;d.x+=d.vx;d.y+=d.vy;d.life--;});
  gs.brickDebris=gs.brickDebris.filter(d=>d.life>0);
  blocks.forEach(b=>{if(b.hitTimer>0)b.hitTimer--;});

  // Flag pole trigger
  if(!gs.underground && mario.x > 198*T && gs.phase === 'playing'){
    gs.phase = 'clear';
    mario.x = 198*T;
    mario.vx = 0;
    mario.vy = 0;
    audio.stopMusic(); 
  }
}

// ══════════════════════════════════════════════════════════════
//  DRAWING
// ══════════════════════════════════════════════════════════════

const ZONE_LABELS:{x:number;label:string;color:string}[] = [
  {x:3, label:"DESIGN ZONE", color:"#f24e1e"},
  {x:52, label:"DEV ZONE", color:"#61dafb"},
  {x:106, label:"3D & CREATIVE", color:"#ea7600"},
  {x:155, label:"BOSS AREA", color:"#e52521"},
];

function drawBg(ctx:CanvasRenderingContext2D, camX:number, frame:number, underground = false) {
  if (underground) {
    ctx.fillStyle='#05020c'; // dark black/purple background
    ctx.fillRect(0,0,CVW,CVH);
    return;
  }
  const grad = ctx.createLinearGradient(0,0,0,CVH);
  grad.addColorStop(0,'#1a0a3e');
  grad.addColorStop(0.25,'#2d1b69');
  grad.addColorStop(0.5,'#5c3fb8');
  grad.addColorStop(0.75,'#7b5cd6');
  grad.addColorStop(1,'#5c94fc');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,CVW,CVH);

  // Stars
  ctx.fillStyle='#fff';
  for(let i=0;i<40;i++){
    const sx=((i*197+37)%800)-((camX*0.05)%800);
    const sy=(i*71+23)%200;
    const sz=i%3===0?2.5:1.5;
    ctx.globalAlpha=0.3+0.3*Math.sin(frame*0.03+i);
    ctx.fillRect(sx<0?sx+800:sx,sy,sz,sz);
  }
  ctx.globalAlpha=1;

  // Hills (parallax)
  const hOff=camX*0.2;
  ctx.fillStyle='#1a5c1a';
  [[150,360,130,75],[380,350,100,65],[600,365,90,55],
   [800,355,120,70],[1050,360,140,80],[1300,350,110,68]].forEach(([hx,hy,rw,rh])=>{
    const rx=(hx-hOff%1600+1600)%1600;
    ctx.beginPath();ctx.ellipse(rx,hy,rw,rh,0,Math.PI,0);ctx.fill();
    ctx.fillStyle='#0d4a0d';
    ctx.beginPath();ctx.ellipse(rx,hy+3,rw*0.6,rh*0.45,0,Math.PI,0);ctx.fill();
    ctx.fillStyle='#1a5c1a';
  });

  // Clouds
  const cOff=camX*0.35;
  ctx.fillStyle='rgba(255,255,255,0.85)';
  [[80,55],[280,35],[480,60],[660,40],[850,50],[1050,38],[1250,58],[1450,42]].forEach(([cx,cy])=>{
    const x2=((cx-cOff%1600)+1600)%1600;
    ctx.beginPath();ctx.arc(x2,cy,26,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x2+32,cy+4,20,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x2-28,cy+6,16,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x2+5,cy-8,18,0,Math.PI*2);ctx.fill();
    ctx.fillRect(x2-28,cy+4,100,16);
  });

  // Zone watermark labels
  ctx.save();
  ZONE_LABELS.forEach(z=>{
    const zx=z.x*T-camX;
    if(zx>-300&&zx<CVW+200){
      ctx.globalAlpha=0.06;
      ctx.fillStyle=z.color;
      ctx.font='bold 58px "Press Start 2P",monospace';
      ctx.fillText(z.label,zx,CVH*0.42);
    }
  });
  ctx.restore();
}

function drawTile(ctx:CanvasRenderingContext2D,tile:number,px:number,py:number,bounce:number){
  const by=py-(bounce>0?Math.sin(bounce/12*Math.PI)*10:0);
  if(tile===GND){
    ctx.fillStyle='#e07840';ctx.fillRect(px,by,T,T);
    ctx.fillStyle='#c84c0c';
    ctx.fillRect(px,by,T,2);ctx.fillRect(px,by+10,T,2);ctx.fillRect(px,by+22,T,2);
    ctx.fillRect(px+16,by,2,T);ctx.fillRect(px,by,2,T);
  }else if(tile===BRK){
    ctx.fillStyle='#c84c0c';ctx.fillRect(px,by,T,T);
    ctx.fillStyle='#8b3408';
    ctx.fillRect(px,by+10,T,3);ctx.fillRect(px,by+22,T,3);
    ctx.fillRect(px+6,by,2,10);ctx.fillRect(px+22,by,2,10);
    ctx.fillRect(px+14,by+13,2,9);ctx.fillRect(px,by+25,2,7);ctx.fillRect(px+20,by+25,2,7);
    ctx.fillStyle='#e07030';ctx.fillRect(px,by,T,2);ctx.fillRect(px,by,2,T);
  }else if(tile===QBK||tile===EBK){
    const hit=tile===EBK;
    ctx.fillStyle=hit?'#666':'#f8d030';ctx.fillRect(px,by,T,T);
    ctx.fillStyle=hit?'#555':'#c8a000';
    ctx.fillRect(px,by,T,3);ctx.fillRect(px,by,3,T);
    ctx.fillRect(px,by+T-3,T,3);ctx.fillRect(px+T-3,by,3,T);
    if(!hit){
      ctx.fillStyle='#8b6000';ctx.font='bold 18px monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('?',px+T/2,by+T/2+1);
    }
  }else if(tile===PTL||tile===PTR){
    const isL=tile===PTL;
    ctx.fillStyle='#00a800';ctx.fillRect(px,by,T,T);
    ctx.fillStyle='#007800';
    if(isL){ctx.fillRect(px+T-4,by,4,T);ctx.fillRect(px,by+T-4,T,4);}
    else{ctx.fillRect(px,by,4,T);ctx.fillRect(px,by+T-4,T,4);}
    ctx.fillStyle='#00cc00';
    if(isL){ctx.fillRect(px,by,4,T-4);ctx.fillRect(px,by,T-4,4);}
    else{ctx.fillRect(px+4,by,T-4,4);}
  }else if(tile===PML||tile===PMR){
    const isL=tile===PML;
    ctx.fillStyle='#00a800';ctx.fillRect(px,by,T,T);
    ctx.fillStyle='#007800';
    if(isL)ctx.fillRect(px+T-4,by,4,T);else ctx.fillRect(px,by,4,T);
    ctx.fillStyle='#00cc00';
    if(isL)ctx.fillRect(px,by,4,T);else ctx.fillRect(px+4,by,4,T);
  }
}

// ── CHARACTER (purple hat, teal overalls — unique design) ─────
function drawHero(ctx:CanvasRenderingContext2D,x:number,y:number,
  frame:number,facing:1|-1,dead:boolean, state?: 'small'|'big'
){
  ctx.save();
  const bx=Math.round(x),by=Math.round(y);
  const w=26,h=state==='big'?56:30;
  ctx.translate(bx+w/2,by+h);
  if(facing===-1)ctx.scale(-1,1);

  const scaleY = state === 'big' ? 56/30 : 1;
  const p=(rx:number,ry:number,rw:number,rh:number,col:string)=>{
    ctx.fillStyle=col;
    const top = Math.round((ry - 41) * scaleY);
    const bottom = Math.round((ry + rh - 41) * scaleY);
    ctx.fillRect(-w/2+rx, top, rw, bottom - top);
  };

  if(!dead){
    // Hat (purple)
    p(3,2,20,6,CHAR.hat);p(0,7,26,4,CHAR.hat);
    // Hat brim highlight
    p(0,7,26,2,CHAR.hatDark);
    // Face (warm skin)
    p(3,11,20,8,CHAR.skin);
    // Eye
    p(15,13,5,4,'#000');
    // Eye white
    p(16,13,3,2,'#fff');
    // Hair/sideburns
    p(3,11,3,4,CHAR.hair);
    // Goatee
    p(8,17,10,3,CHAR.hair);
    // Body (teal shirt)
    p(1,20,24,10,CHAR.shirt);
    // Teal overalls sides (darker)
    p(0,22,4,8,CHAR.shirtDk);p(22,22,4,8,CHAR.shirtDk);
    // Belt buckles (gold)
    p(5,20,5,3,CHAR.buckle);p(16,20,5,3,CHAR.buckle);
    // Legs (teal)
    const off=frame%2===0?0:2;
    p(1+off,30,10,6,CHAR.shirt);p(15-off,30,10,6,CHAR.shirt);
    // Shoes (dark purple)
    p(0,36,12,5,CHAR.shoes);p(14,36,12,5,CHAR.shoes);
  }else{
    // Dead pose
    p(3,4,20,6,CHAR.hat);
    p(3,10,20,8,CHAR.skin);
    p(2,18,22,8,CHAR.shirt);
    // X eyes (relative to translated origin)
    ctx.strokeStyle='#000';ctx.lineWidth=2;
    const ey1=Math.round((12-41)*scaleY),ey2=Math.round((16-41)*scaleY);
    ctx.beginPath();ctx.moveTo(4,ey1);ctx.lineTo(10,ey2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(10,ey1);ctx.lineTo(4,ey2);ctx.stroke();
  }
  ctx.restore();
}

// ── Enemy (brown blob — different from original) ──────────────
function drawEnemy(ctx:CanvasRenderingContext2D,g:Enemy){
  if(!g.alive)return;
  const{x,y,w,h,squished,animFrame}=g;
  const gH=squished?h*0.3:h;
  const gY=squished?y+h*0.7:y;

  // Body (dark brown)
  ctx.fillStyle='#8B4513';
  ctx.beginPath();ctx.ellipse(x+w/2,gY+gH*0.55,w/2,gH*0.5,0,0,Math.PI*2);ctx.fill();
  // Head (lighter brown)
  ctx.fillStyle='#A0522D';
  ctx.beginPath();ctx.ellipse(x+w/2,gY+gH*0.25,w/2*0.9,gH*0.3,0,0,Math.PI*2);ctx.fill();

  if(!squished){
    // Eyes
    ctx.fillStyle='#fff';
    ctx.fillRect(x+4,gY+2,9,7);ctx.fillRect(x+15,gY+2,9,7);
    ctx.fillStyle='#000';
    ctx.fillRect(x+6,gY+4,5,4);ctx.fillRect(x+17,gY+4,5,4);
    // Angry brows
    ctx.strokeStyle='#000';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+3,gY+1);ctx.lineTo(x+13,gY+4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+25,gY+1);ctx.lineTo(x+15,gY+4);ctx.stroke();
    // Feet
    ctx.fillStyle='#5C2D00';
    const f=animFrame===0?2:-2;
    ctx.fillRect(x+1+f,gY+gH-5,10,6);ctx.fillRect(x+17-f,gY+gH-5,10,6);
  }else{
    ctx.strokeStyle='#fff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+5,gY+3);ctx.lineTo(x+11,gY+8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+11,gY+3);ctx.lineTo(x+5,gY+8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+17,gY+3);ctx.lineTo(x+23,gY+8);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x+23,gY+3);ctx.lineTo(x+17,gY+8);ctx.stroke();
  }
}

function drawPowerUp(ctx:CanvasRenderingContext2D, p:PowerUp){
  if(!p.active && p.animTimer===0) return;
  const {x,y,w,h} = p;
  ctx.fillStyle='#f8d030';
  ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#d82800';
  ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w/3,h/3,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(x+w/4+2,y+h/4+2,3,0,Math.PI*2);ctx.fill();
}

function drawCoin(ctx:CanvasRenderingContext2D,c:Coin,frame:number){
  if(c.collected)return;
  const scale=Math.abs(Math.cos((c.animT+frame*0.5)*0.07));
  const floatY=Math.sin(frame*0.04+c.x*0.01)*3;
  const cx=c.x,cy=c.y+floatY;
  const cw=24*scale;
  if(cw<2)return;
  ctx.fillStyle='#f8d030';
  ctx.fillRect(cx+12-cw/2,cy,cw,22);
  ctx.strokeStyle='#c8a000';ctx.lineWidth=2;
  ctx.strokeRect(cx+12-cw/2,cy,cw,22);
  if(scale>0.5){
    ctx.fillStyle='#8b6000';ctx.font='bold 10px monospace';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('★',cx+12,cy+11);
  }
}

// ── SKILL POP — slow, animated, highly readable ───────────────
function drawSkillPop(ctx:CanvasRenderingContext2D,sp:SkillPop,frame:number){
  ctx.save();
  const age=sp.maxLife-sp.life;
  const fadeOut=sp.life<50 ? sp.life/50 : 1; // fade last ~0.8 sec
  const scaleEase=sp.scale;
  const alpha=fadeOut*scaleEase;
  if(alpha<=0){ctx.restore();return;}

  ctx.globalAlpha=alpha;

  // Gentle horizontal sway
  const sway=Math.sin(frame*0.025+sp.x*0.1)*6;

  ctx.font='bold 12px "Press Start 2P",monospace';
  const mw=ctx.measureText(sp.skill).width;
  const px=sp.x+sway;
  const py=sp.y;
  const padX=14, padY=8;
  const boxW=mw+padX*2;
  const boxH=28;

  // Scale transform
  ctx.translate(px,py);
  ctx.scale(scaleEase,scaleEase);
  ctx.translate(-px,-py);

  // Outer glow
  ctx.shadowColor=sp.color;
  ctx.shadowBlur=18*alpha;

  // Background pill
  ctx.fillStyle='rgba(10,0,30,0.85)';
  ctx.beginPath();
  ctx.roundRect(px-boxW/2,py-padY,boxW,boxH,8);
  ctx.fill();

  // Color border
  ctx.strokeStyle=sp.color;ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.roundRect(px-boxW/2,py-padY,boxW,boxH,8);
  ctx.stroke();

  // Accent line at top
  ctx.fillStyle=sp.color;
  ctx.fillRect(px-boxW/2+4,py-padY,boxW-8,2.5);

  // Text with glow
  ctx.shadowBlur=0;
  ctx.fillStyle=sp.color;
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(sp.skill,px,py+padY/2+2);

  ctx.restore();
}

function drawScorePop(ctx:CanvasRenderingContext2D,sp:ScorePop){
  ctx.save();
  ctx.globalAlpha=Math.min(1,sp.life/15);
  ctx.fillStyle='#fff';
  ctx.font='bold 10px "Press Start 2P",monospace';
  ctx.textAlign='center';
  ctx.fillText('+'+sp.val,sp.x,sp.y);
  ctx.restore();
}

function drawFlag(ctx:CanvasRenderingContext2D, gs:GS){
  const px=198*T;
  const flagY=gs.flagY ?? 3*T;
  // Flagpole
  ctx.fillStyle='#aaa';ctx.fillRect(px+14,3*T,4,9*T);
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(px+16,3*T,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=CHAR.hat;
  ctx.beginPath();
  ctx.moveTo(px+18,flagY+4);ctx.lineTo(px+50,flagY+16);ctx.lineTo(px+18,flagY+28);
  ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 7px "Press Start 2P",monospace';
  ctx.textAlign='center';
  ctx.fillText('ASG',px+32,flagY+18);
  
  // Castle at end
  const cx = 202*T;
  const cy = 12*T; // ground
  ctx.fillStyle = '#C84C0C'; // brick
  ctx.fillRect(cx, cy - 4*T, 4*T, 4*T); // main body
  // door
  ctx.fillStyle = '#0a0018'; // dark interior
  ctx.beginPath();
  ctx.arc(cx + 2*T, cy, 1.2*T, Math.PI, 0); 
  ctx.fill();
  ctx.fillRect(cx + 0.8*T, cy - 1.2*T, 2.4*T, 1.2*T);
  // battlements (3 towers for proper castle)
  ctx.fillStyle = '#C84C0C';
  ctx.fillRect(cx, cy - 5*T, 1*T, 5*T); // left tower
  ctx.fillRect(cx + 1.5*T, cy - 5*T, 1*T, 5*T); // middle tower
  ctx.fillRect(cx + 3*T, cy - 5*T, 1*T, 5*T); // right tower
  ctx.fillStyle = '#1a0a3e'; // dark gaps
  ctx.fillRect(cx + 1*T, cy - 4*T, 0.5*T, 0.5*T);
  ctx.fillRect(cx + 2.5*T, cy - 4*T, 0.5*T, 0.5*T);
}

function drawHUD(ctx:CanvasRenderingContext2D,gs:GS){
  ctx.fillStyle='rgba(0,0,15,0.65)';
  ctx.fillRect(0,0,CVW,48);

  ctx.font='12px "Press Start 2P",monospace';
  ctx.textAlign='left';ctx.fillStyle='#fff';
  ctx.fillText('ADARSH',12,18);
  ctx.fillText(String(gs.score).padStart(7,'0'),12,36);

  ctx.fillStyle='#f8d030';
  ctx.beginPath();ctx.arc(CVW*0.35,22,7,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#c8a000';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='11px "Press Start 2P",monospace';
  ctx.fillText('×'+String(gs.coinCount).padStart(2,'0'),CVW*0.35+12,26);

  ctx.textAlign='center';ctx.fillStyle='#fff';
  ctx.font='10px "Press Start 2P",monospace';
  ctx.fillText('WORLD',CVW*0.55,14);
  ctx.fillText('1-1',CVW*0.55,32);

  ctx.textAlign='right';
  ctx.fillStyle=gs.time<80?'#e52521':'#fff';
  ctx.fillText('TIME',CVW-14,14);
  ctx.fillText(String(gs.time).padStart(3,'0'),CVW-14,32);

  ctx.textAlign='right';
  ctx.fillText('×'+gs.lives,CVW*0.8,26);
  ctx.fillStyle=CHAR.hat;ctx.font='14px monospace';
  ctx.fillText('♥',CVW*0.8-28,27);

  ctx.textAlign='left';ctx.fillStyle='#43b047';
  ctx.font='8px "Press Start 2P",monospace';
  ctx.fillText('SKILLS: '+gs.revealedSkills.length+'/'+SKILLS.length,CVW*0.35,42);
}

function drawZoneBar(ctx:CanvasRenderingContext2D,camX:number){
  const marioWorldX=camX+CVW/3;
  const progress=marioWorldX/(LW*T);
  const barW=CVW-40,barH=6,barY=CVH-12;
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.fillRect(20,barY,barW,barH);
  ctx.fillStyle='#fbd000';
  ctx.fillRect(20,barY,barW*Math.min(1,progress),barH);
  ZONE_LABELS.forEach(z=>{
    const zp=(z.x*T)/(LW*T);
    ctx.fillStyle=z.color;
    ctx.fillRect(20+barW*zp-1,barY-2,3,barH+4);
  });
  ctx.fillStyle=CHAR.hat;
  ctx.beginPath();ctx.arc(20+barW*progress,barY+3,5,0,Math.PI*2);ctx.fill();
}

// INTRO REMOVED

// ── Title screen (Classic Super Mario Style) ───────────
function drawTitle(ctx:CanvasRenderingContext2D,frame:number){
  // Title screen is drawn over the game world (which is paused at x=0)
  ctx.font='bold 48px "Press Start 2P",monospace';
  ctx.textAlign='center';
  
  // Shadow
  ctx.fillStyle='#000';
  ctx.fillText('SUPER ADARSH',CVW/2 + 4, 120 + 4);
  ctx.fillText('PORTFOLIO',CVW/2 + 4, 180 + 4);
  
  // Text
  ctx.fillStyle='#e52521';
  ctx.fillText('SUPER ADARSH',CVW/2,120);
  ctx.fillStyle='#fbd000';
  ctx.fillText('PORTFOLIO',CVW/2,180);

  ctx.fillStyle='#fff';
  ctx.font='16px "Press Start 2P",monospace';
  ctx.fillText('UI/UX DESIGNER × DEVELOPER',CVW/2, 230);
  
  if(Math.sin(frame*0.08)>0){
    ctx.fillStyle='#fbd000';
    ctx.font='16px "Press Start 2P",monospace';
    ctx.fillText('PRESS ANY KEY OR TAP TO START',CVW/2, 350);
  }
}

function drawWin(ctx:CanvasRenderingContext2D,gs:GS,frame:number){
  // Fireworks
  if(gs.fireworks) {
    ctx.save();
    ctx.translate(-Math.round(gs.camX), 0);
    gs.fireworks.forEach(fw => {
      const p = 1 - (fw.life / fw.maxLife);
      const radius = p * 60; // expand up to 60px
      ctx.globalAlpha = fw.life / fw.maxLife;
      
      for(let i=0; i<8; i++){
        const angle = (i / 8) * Math.PI * 2;
        const sx = fw.x + Math.cos(angle) * radius;
        const sy = fw.y + Math.sin(angle) * radius;
        ctx.fillStyle = fw.color;
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI*2); ctx.fill();
        
        const tsx = fw.x + Math.cos(angle) * radius * 0.7;
        const tsy = fw.y + Math.sin(angle) * radius * 0.7;
        ctx.beginPath(); ctx.arc(tsx, tsy, 1.5, 0, Math.PI*2); ctx.fill();
      }
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawGameOver(ctx:CanvasRenderingContext2D,frame:number){
  ctx.fillStyle='rgba(0,0,0,0.92)';ctx.fillRect(0,0,CVW,CVH);
  ctx.fillStyle='#e52521';ctx.font='bold 28px "Press Start 2P",monospace';
  ctx.textAlign='center';ctx.fillText('GAME OVER',CVW/2,CVH/2-20);
  if(Math.sin(frame*0.08)>0){
    ctx.fillStyle='#fff';ctx.font='10px "Press Start 2P",monospace';
    ctx.fillText('PRESS ANY KEY TO RETRY',CVW/2,CVH/2+30);
  }
}

function drawRespawnScreen(ctx:CanvasRenderingContext2D,gs:GS){
  ctx.fillStyle='#000';ctx.fillRect(0,0,CVW,CVH);
  
  ctx.fillStyle='#fff';
  ctx.font='16px "Press Start 2P",monospace';
  ctx.textAlign='center';
  ctx.fillText('WORLD  1-1',CVW/2,CVH/2-40);
  
  drawHero(ctx,CVW/2-30,CVH/2-10,0,1,false,gs.mario.state);
  
  ctx.fillStyle='#fff';
  ctx.textAlign='left';
  ctx.fillText('×  '+gs.lives,CVW/2+15,CVH/2+5);
  
  ctx.font='10px "Press Start 2P",monospace';
  ctx.fillStyle='#fbd000';
  ctx.textAlign='center';
  ctx.fillText("LET'S EXPLORE AGAIN",CVW/2,CVH/2+80);
}

function drawScanlines(ctx:CanvasRenderingContext2D){
  ctx.fillStyle='rgba(0,0,0,0.04)';
  for(let y=0;y<CVH;y+=3) ctx.fillRect(0,y,CVW,1);
}

// ══════════════════════════════════════════════════════════════
//  REACT COMPONENT
// ══════════════════════════════════════════════════════════════

const audio = new AudioEngine();

export default function MarioGame({
  onScoreUpdate,
  onSkillReveal,
  onGameComplete,
}: {
  onScoreUpdate?: (score:number, coins:number) => void;
  onSkillReveal?: (skills:string[]) => void;
  onGameComplete?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef     = useRef<GS>(initState());
  const keysRef   = useRef<Keys>({left:false,right:false,jump:false,run:false,jumpHeld:false});
  const rafRef    = useRef<number>(0);
  const [muted, setMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  // Sync callbacks to refs to prevent rendering cycle recreation of loop
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const onSkillRevealRef = useRef(onSkillReveal);
  const onGameCompleteRef = useRef(onGameComplete);

  useEffect(() => { onScoreUpdateRef.current = onScoreUpdate; }, [onScoreUpdate]);
  useEffect(() => { onSkillRevealRef.current = onSkillReveal; }, [onSkillReveal]);
  useEffect(() => { onGameCompleteRef.current = onGameComplete; }, [onGameComplete]);

  useEffect(() => {
    audio.init();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (!entry.isIntersecting) {
        if (gsRef.current.phase === 'playing') {
          gsRef.current.phase = 'paused';
          audio.stopMusic();
          setIsPaused(true);
        }
      }
    }, { threshold: 0.1 });
    
    if (canvasRef.current) {
      observer.observe(canvasRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(()=>{
    const MAP:Record<string,keyof Keys>={
      ArrowLeft:'left',a:'left',A:'left',
      ArrowRight:'right',d:'right',D:'right',
      ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',
      ArrowDown:'down',s:'down',S:'down',
      Shift:'run',
    };
    const down=(e:KeyboardEvent)=>{
      audio.ensurePlaying();
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
      }
      const k=MAP[e.key];
      if(k){(keysRef.current as Record<string,boolean>)[k]=true;}
      if(k==='jump')keysRef.current.jumpHeld=true;
      if(e.key==='m'||e.key==='M')setMuted(audio.toggleMute());

      const gs=gsRef.current;
      // Start game from title
      if(gs.phase==='title'){
        audio.init();
        audio.startMusic();
        gs.phase='respawn_screen';
        gs.respawnTimer=0;
      }
      // Restart
      if(gs.phase==='win'||gs.phase==='gameover'){
        const fresh=initState();fresh.phase='respawn_screen';
        fresh.score=gs.phase==='win'?gs.score:0;
        fresh.lives=gs.phase==='win'?gs.lives:3;
        fresh.respawnTimer=0;
        Object.assign(gsRef.current,fresh);
        audio.init();
      }
    };
    const up=(e:KeyboardEvent)=>{
      const k=MAP[e.key];
      if(k)(keysRef.current as Record<string,boolean>)[k]=false;
      if(k==='jump')keysRef.current.jumpHeld=false;
    };
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[]);

  const loop=useCallback(()=>{
    const gs=gsRef.current;
    update(gs,keysRef.current,audio);

    const canvas=canvasRef.current;
    if(!canvas){rafRef.current=requestAnimationFrame(loop);return;}
    const ctx=canvas.getContext('2d');
    if(!ctx){rafRef.current=requestAnimationFrame(loop);return;}

    ctx.clearRect(0,0,CVW,CVH);

    // ── RESPAWN SCREEN ──
    if(gs.phase==='respawn_screen'){
      drawRespawnScreen(ctx,gs);
      drawHUD(ctx,gs);
      drawScanlines(ctx);
      rafRef.current=requestAnimationFrame(loop);
      return;
    }

    drawBg(ctx,gs.camX,gs.frameCount,gs.underground);

    ctx.save();
    ctx.translate(-Math.round(gs.camX),0);

    // Tiles (only visible range)
    const startTx=Math.max(0,Math.floor(gs.camX/T)-1);
    const endTx=Math.min(LW-1,Math.ceil((gs.camX+CVW)/T)+1);
    for(let ty=0;ty<LH;ty++){
      for(let tx=startTx;tx<=endTx;tx++){
        const tile=gs.tiles[ty][tx];
        if(tile===AIR)continue;
        const blk=gs.blocks.find(b=>b.tx===tx&&b.ty===ty);
        drawTile(ctx,tile,tx*T,ty*T,blk?blk.hitTimer:0);
      }
    }

    drawFlag(ctx,gs);
    gs.coins.forEach(c=>drawCoin(ctx,c,gs.frameCount));
    gs.powerups.forEach(p=>drawPowerUp(ctx,p));
    gs.goombas.forEach(g=>drawEnemy(ctx,g));

    // Hero
    if(!(gs.phase==='dead'&&gs.mario.deadTimer<3) && gs.phase!=='win') {
      if(!gs.mario.invincibleTimer || Math.floor(gs.mario.invincibleTimer / 4) % 2 === 0) {
        drawHero(ctx,gs.mario.x,gs.mario.y,gs.mario.animFrame,gs.mario.facing,gs.mario.dead, gs.mario.state);
      }
    }

    // Redraw pipe tops for masking
    for(let ty=0;ty<LH;ty++){
      for(let tx=startTx;tx<=endTx;tx++){
        const tile=gs.tiles[ty][tx];
        if(tile===PTL||tile===PTR){
          const blk=gs.blocks.find(b=>b.tx===tx&&b.ty===ty);
          drawTile(ctx,tile,tx*T,ty*T,blk?blk.hitTimer:0);
        }
      }
    }

    // Skill popups (slow, animated, readable)
    gs.skillPops.forEach(sp=>drawSkillPop(ctx,sp,gs.frameCount));
    gs.scorePops.forEach(sp=>drawScorePop(ctx,sp));

    ctx.restore();

    // HUD
    drawHUD(ctx,gs);
    drawZoneBar(ctx,gs.camX);
    drawScanlines(ctx);

    // Overlays
    if(gs.phase==='title')drawTitle(ctx,gs.frameCount);
    if(gs.phase==='win')drawWin(ctx,gs,gs.frameCount);
    if(gs.phase==='gameover')drawGameOver(ctx,gs.frameCount);

    // Callbacks
    if(gs.frameCount%15===0){
      onScoreUpdateRef.current?.(gs.score,gs.coinCount);
      onSkillRevealRef.current?.(gs.revealedSkills);
    }
    if(gs.phase==='win' && gs.winTimer===1){
      onGameCompleteRef.current?.();
    }
    if(gs.phase==='win' && gs.winTimer===700 && !showWinOverlay){
      setShowWinOverlay(true);
    }

    rafRef.current=requestAnimationFrame(loop);
  }, []);

  useEffect(()=>{
    rafRef.current=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(rafRef.current);};
  },[loop]);

  useEffect(()=>{
    return()=>{audio.stopMusic();};
  },[]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    audio.ensurePlaying();
    const gs = gsRef.current;
    if (gs.phase === 'title') {
      audio.init();
      audio.startMusic();
      gs.phase = 'respawn_screen';
      gs.respawnTimer = 0;
    } else if (gs.phase === 'gameover') {
      audio.init();
      audio.startMusic();
      const fresh = initState();
      fresh.phase = 'playing';
      Object.assign(gsRef.current, fresh);
    }
  };

  // Touch controls
  const touch=(action:keyof Keys,val:boolean)=>{
    audio.ensurePlaying();
    (keysRef.current as Record<string,boolean>)[action]=val;
    if(action==='jump')keysRef.current.jumpHeld=val;
    const gs=gsRef.current;
    if(gs.phase==='title'&&val){
      audio.init();
      audio.startMusic();
      gs.phase='respawn_screen';gs.respawnTimer=0;
    }
    if((gs.phase==='win'||gs.phase==='gameover')&&val){
      const fresh=initState();fresh.phase='playing';
      Object.assign(gsRef.current,fresh);
      setShowWinOverlay(false);
      audio.init();audio.startMusic();
    }
  };

  return(
    <div style={{position:'relative',width:'100%',height:'100%',background:'#000',overflow:'hidden'}}>
      <canvas ref={canvasRef} width={CVW} height={CVH}
        onPointerDown={handleCanvasPointerDown}
        style={{display:'block',width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',imageRendering:'pixelated',cursor:'default'}}
      />

      {/* WIN OVERLAY (HTML/CSS) */}
      {showWinOverlay && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 90,
          width: '90%', maxWidth: '500px', padding: '32px 16px',
          background: 'rgba(0,0,20,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: "'Press Start 2P', monospace",
          border: '4px solid #fbd000', boxSizing: 'border-box',
          borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
        }}>
          <div style={{ fontSize: 20, marginBottom: 24, color: '#fbd000', textShadow: '4px 4px 0 #8b0000', textAlign: 'center', lineHeight: '1.4' }}>WANNA EXPLORE AGAIN?</div>
          <div style={{ fontSize: 16, marginBottom: 16 }}>SCORE: {String(gsRef.current.score).padStart(7,'0')}</div>
          <div style={{ fontSize: 12, marginBottom: 32, color: '#43b047' }}>SKILLS EXPLORED: {gsRef.current.revealedSkills.length} / {SKILLS.length}</div>
          
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setShowWinOverlay(false);
                const fresh=initState();fresh.phase='playing';
                Object.assign(gsRef.current,fresh);
                audio.init();audio.startMusic();
              }}
              style={{ 
                padding: '16px 32px', fontSize: 16, background: '#e52521', color: '#fff',
                border: '4px solid #fff', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
                boxShadow: '0 4px 0 #8b0000', transition: 'transform 0.1s'
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              PLAY AGAIN
            </button>
            <button 
              onClick={() => {
                window.scrollBy({ top: window.innerHeight * 1.5, behavior: 'smooth' });
              }}
              style={{ 
                padding: '16px 32px', fontSize: 16, background: '#049cd8', color: '#fff',
                border: '4px solid #fff', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
                boxShadow: '0 4px 0 #025070', transition: 'transform 0.1s'
              }}
              onPointerDown={e => (e.currentTarget.style.transform = 'translateY(4px)')}
              onPointerUp={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onPointerLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              SCROLL DOWN
            </button>
          </div>
        </div>
      )}


      {/* GLOBAL MUTE BUTTON */}
      <button 
        onClick={() => setMuted(audio.toggleMute())}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 100,
          background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%',
          width: 44, height: 44, color: '#fff', cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* PAUSE OVERLAY */}
      {isPaused && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: "'Press Start 2P', monospace"
        }}>
          <div style={{ fontSize: 32, marginBottom: 24, color: '#fbd000', letterSpacing: '4px' }}>PAUSED</div>
          <button 
            onClick={() => {
              gsRef.current.phase = 'playing';
              setIsPaused(false);
              if (!audio.muted) audio.startMusic(gsRef.current.underground ? 'underground' : 'overworld');
            }}
            style={{ 
              padding: '16px 32px', fontSize: 16, background: '#e52521', color: '#fff',
              border: '4px solid #fff', cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
              boxShadow: '0 4px 0 #8b0000'
            }}
          >
            RESUME
          </button>
        </div>
      )}

      {/* ── PORTRAIT MODE ROTATION OVERLAY ── */}
      <div className="rotate-overlay" id="rotate-overlay">
        <div className="rotate-content">
          <div className="rotate-phone-icon">
            <svg viewBox="0 0 100 100" width="80" height="80">
              <rect x="25" y="10" width="50" height="80" rx="8" fill="none" stroke="#fbd000" strokeWidth="3">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="90 50 50" dur="1.5s" repeatCount="indefinite" />
              </rect>
              <circle cx="50" cy="82" r="4" fill="#fbd000">
                <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="90 50 50" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:12,color:'#fbd000',textAlign:'center',lineHeight:'2em',marginTop:16}}>
            ROTATE YOUR DEVICE
          </div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:'rgba(255,255,255,0.5)',textAlign:'center',marginTop:12,lineHeight:'1.8em'}}>
            THIS EXPERIENCE IS BEST<br/>IN LANDSCAPE MODE
          </div>
          <div style={{marginTop:24,display:'flex',gap:8,justifyContent:'center'}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#7b2fbe',animation:'pulse-dot 1.5s ease-in-out infinite'}}></span>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#049cd8',animation:'pulse-dot 1.5s ease-in-out infinite 0.3s'}}></span>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#fbd000',animation:'pulse-dot 1.5s ease-in-out infinite 0.6s'}}></span>
          </div>
        </div>
      </div>

      {/* Touch D-pad — enlarged for mobile friendliness, mute integrated */}
      {/* Touch D-pad — positioned inside the canvas aspect-ratio bounds! */}
      <div style={{
        position:'absolute',bottom:12,left:12,right:12,
        display:'flex',justifyContent:'space-between',
        pointerEvents:'none',alignItems:'flex-end',
      }}>
        {/* Left side: D-pad */}
        <div style={{display:'flex',gap:6,pointerEvents:'all'}}>
          <button onPointerDown={()=>touch('left',true)} onPointerUp={()=>touch('left',false)}
            onPointerLeave={()=>touch('left',false)} style={dBtn}>◀</button>
          <button onPointerDown={()=>touch('right',true)} onPointerUp={()=>touch('right',false)}
            onPointerLeave={()=>touch('right',false)} style={dBtn}>▶</button>
        </div>
        {/* Right side: Action buttons + mute */}
        <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end',pointerEvents:'all'}}>
          {/* Mute button — small, above action buttons */}
          <button onClick={()=>setMuted(audio.toggleMute())}
            style={{
              background:'rgba(0,0,20,0.8)',border:'2px solid rgba(251,208,0,0.5)',
              color:'#fbd000',borderRadius:8,padding:'4px 10px',
              fontFamily:"'Press Start 2P',monospace",fontSize:7,cursor:'pointer',
              userSelect:'none',WebkitUserSelect:'none' as never,touchAction:'manipulation',
            }}
          >{muted?'🔇':'🔊'}</button>
          <div style={{display:'flex',gap:6}}>
            <button onPointerDown={()=>touch('run',true)} onPointerUp={()=>touch('run',false)}
              onPointerLeave={()=>touch('run',false)}
              style={{...dBtn,width:85,fontSize:11,background:'rgba(4,156,216,0.88)',color:'#fff'}}>RUN</button>
            <button onPointerDown={()=>touch('jump',true)} onPointerUp={()=>touch('jump',false)}
              onPointerLeave={()=>touch('jump',false)}
              style={{...dBtn,width:95,fontSize:11,background:CHAR.hat+'dd',color:'#fff'}}>JUMP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const dBtn:React.CSSProperties={
  width:60,height:60,background:'rgba(251,208,0,0.88)',
  border:'3px solid rgba(0,0,0,0.5)',borderRadius:14,
  color:'#1a0533',fontFamily:"'Press Start 2P',monospace",fontSize:18,
  cursor:'pointer',userSelect:'none',WebkitUserSelect:'none',
  touchAction:'manipulation',display:'flex',alignItems:'center',justifyContent:'center',
  boxShadow:'0 4px 15px rgba(0,0,0,0.4)',
};
