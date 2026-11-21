import { test } from 'node:test'
import assert from 'node:assert/strict'
import { argument, interpolation, modulus, multiply, presets } from '../src/math.ts'
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`)
test('all eight presets agree with Cartesian products, moduli, angles, and matrices',()=>{
  for(const p of presets)for(const z of [{x:1,y:2},{x:-3,y:4},{x:0,y:-2}]){
    const out=multiply(z,p)
    near(modulus(out),modulus(z)*modulus(p))
    near(out.x,modulus(z)*modulus(p)*Math.cos(argument(z)!+argument(p)!))
    near(out.y,modulus(z)*modulus(p)*Math.sin(argument(z)!+argument(p)!))
    near(out.x,p.x*z.x-p.y*z.y);near(out.y,p.y*z.x+p.x*z.y)
  }
})
test('zero and signed zero have no argument, including zero multipliers',()=>{
  assert.equal(argument({x:0,y:0}),null)
  assert.equal(argument({x:-0,y:-0}),null)
  assert.deepEqual(multiply({x:1,y:2},{x:0,y:0}),{x:0,y:0})
  assert.equal(argument(multiply({x:0,y:0},{x:2,y:3})),null)
  assert.deepEqual(interpolation({x:0,y:0},.5),{x:.5,y:0})
})
test('principal argument wraps at negative real axis, without classifying tiny numbers as zero',()=>{
  near(argument({x:-1,y:-0})!,Math.PI)
  near(argument({x:1e-20,y:1e-20})!,Math.PI/4)
  near(argument(multiply({x:-1,y:1},{x:0,y:1}))!,-3*Math.PI/4)
})
test('animation is identity initially, exact multiplication finally, and follows polar interpolation',()=>{
  for(const p of [...presets,{x:0,y:0}]){
    assert.deepEqual(interpolation(p,0),{x:1,y:0})
    assert.deepEqual(interpolation(p,1),p)
    const mid=interpolation(p,.5)
    near(modulus(mid),(1+modulus(p))/2)
    near(argument(mid)!, (argument(p)??0)/2)
  }
})
