(function(root){
  'use strict';
  class BobCallPool {
    constructor(seed=0xb0bca11){this.random=seed>>>0||0xb0bca11;this.bag=[];this.cursor=0;this.last=null;this.key='';}
    nextRandom(){let x=this.random;x^=x<<13;x^=x>>>17;x^=x<<5;return this.random=x>>>0;}
    configure(calls,category){
      const seen=new Set();const pool=calls.filter(c=>c.category===category&&c.available!==false&&c.file&&!seen.has(c.occurrence_id)&&seen.add(c.occurrence_id));
      if(pool.length>256)throw new RangeError('Call category exceeds 256 distinct occurrences');
      const key=category+':'+pool.map(c=>c.occurrence_id+':'+c.id).sort().join('|');
      if(key!==this.key){this.key=key;this.bag=pool.slice();this.shuffle();}
      return this.bag.length;
    }
    shuffle(){
      for(let i=this.bag.length;i>1;i--){const j=this.nextRandom()%i;[this.bag[i-1],this.bag[j]]=[this.bag[j],this.bag[i-1]];}
      if(this.bag.length>1&&this.bag[0].occurrence_id===this.last){const j=1+this.nextRandom()%(this.bag.length-1);[this.bag[0],this.bag[j]]=[this.bag[j],this.bag[0]];}
      this.cursor=0;
    }
    next(){if(!this.bag.length)return null;if(this.cursor===this.bag.length)this.shuffle();const clip=this.bag[this.cursor++];this.last=clip.occurrence_id;return clip;}
  }
  root.BobCallPool=BobCallPool;
})(globalThis);
