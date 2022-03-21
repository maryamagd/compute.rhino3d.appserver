import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.126.0/build/three.module.js'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/controls/TransformControls.js'
import { Rhino3dmLoader } from 'https://cdn.jsdelivr.net/npm/three@0.126.0/examples/jsm/loaders/3DMLoader.js'
import rhino3dm from 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/rhino3dm.module.js'

// set up loader for converting the results to threejs
const loader = new Rhino3dmLoader()
loader.setLibraryPath( 'https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/' )

// initialise 'data' object that will be used by compute()
const data = {
  definition: 'Canopy_maker.gh',
  inputs: getInputs()
}


const definition = "Canopy_maker.gh";

// setup input change events
const Column_Radius_slider = document.getElementById( 'Column_Radius' )
Column_Radius_slider.addEventListener( 'mouseup', onSliderChange, false )
Column_Radius_slider.addEventListener( 'touchend', onSliderChange, false )
const Column_Height_slider = document.getElementById( 'Column_Height' )
Column_Height_slider.addEventListener( 'mouseup', onSliderChange, false )
Column_Height_slider.addEventListener( 'touchend', onSliderChange, false )
const U_Divisions_slider = document.getElementById( 'U_Divisions' )
U_Divisions_slider.addEventListener( 'mouseup', onSliderChange, false )
U_Divisions_slider.addEventListener( 'touchend', onSliderChange, false )
const V_Divisions_slider = document.getElementById( 'V_Divisions' )
V_Divisions_slider.addEventListener( 'mouseup', onSliderChange, false )
V_Divisions_slider.addEventListener( 'touchend', onSliderChange, false )
const Canopy_Depth_slider = document.getElementById( 'Canopy_Depth' )
Canopy_Depth_slider.addEventListener( 'mouseup', onSliderChange, false )
Canopy_Depth_slider.addEventListener( 'touchend', onSliderChange, false )

const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download

let points = []

// globals
let rhino, doc

rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m

    init()
    loadContext()
    rndPts()
    compute()
})


function rndPts() {
  // generate Inital points
  const startPts = [
    { x: 1.5, y: 0.3, z: 0 },
    { x: 2.1, y: 28.9, z: 0 },
    { x: 33.18, y: 20, z: 0 },
    { x: 20.54, y: -5.17, z: 0 },
  ]

  const cntPts = startPts.length

  for (let i = 0; i < cntPts; i++) {
    const x = startPts[i].x
    const y = startPts[i].y
    const z = startPts[i].z

    const pt = "{\"X\":" + x + ",\"Y\":" + y + ",\"Z\":" + z + "}"

    console.log( `x ${x} y ${y}` )

    points.push(pt)

    //viz in three
    const icoGeo = new THREE.IcosahedronGeometry(5)
    const icoMat = new THREE.MeshNormalMaterial()
    const ico = new THREE.Mesh( icoGeo, icoMat )
    ico.name = 'ico'
    ico.position.set( x, y, z)
    scene.add( ico )
    
    let tcontrols = new TransformControls( camera, renderer.domElement )
    tcontrols.enabled = true
    tcontrols.attach( ico )
    tcontrols.showZ = false
    tcontrols.addEventListener( 'dragging-changed', onChange )
    scene.add(tcontrols)
    
  }

}

let dragging = false
function onChange() {
  dragging = ! dragging
  if ( !dragging ) {
    // update points position
    points = []
    scene.traverse(child => {
      if ( child.name === 'ico' ) {
        const pt = "{\"X\":" + child.position.x + ",\"Y\":" + child.position.y + ",\"Z\":" + child.position.z + "}"
        points.push( pt )
        console.log(pt)
      }
    }, false)

    compute()

    controls.enabled = true
    return 
}

  controls.enabled = false

}

  /////////////////////////////////////////////////////////////////////////////
 //                            HELPER  FUNCTIONS                            //
/////////////////////////////////////////////////////////////////////////////

/**
 * Gets <input> elements from html and sets handlers
 * (html is generated from the grasshopper definition)
 */
 function getInputs() {
  const inputs = {}
  for (const input of document.getElementsByTagName('input')) {
    switch (input.type) {
      case 'number':
        inputs[input.id] = input.valueAsNumber
        input.onchange = onSliderChange
        break
      case 'range':
        inputs[input.id] = input.valueAsNumber
        input.onmouseup = onSliderChange
        input.ontouchend = onSliderChange
        break
      case 'checkbox':
        inputs[input.id] = input.checked
        input.onclick = onSliderChange
        break
      default:
        break
    }
  }
  return inputs
}

// more globals
var scene, camera, renderer, controls, raycaster, selectedMaterial;

/**
 * Sets up the scene, camera, renderer, lights and controls and starts the animation
 */
function init() {

    // Rhino models are z-up, so set this as the default
    THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 );

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1, 1, 1)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000)
    camera.position.set(1, -1, 1) // like perspective view

    // very light grey for background, like rhino
    scene.background = new THREE.Color('whitesmoke')

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio( window.devicePixelRatio )
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight( 0xffffff )
    directionalLight.intensity = 2
    scene.add( directionalLight )

    const ambientLight = new THREE.AmbientLight()
    scene.add( ambientLight )

    // handle changes in the window size
    window.addEventListener( 'resize', onWindowResize, false )

    animate()
}

function loadContext() {
loader.load('Public_Space.3dm', function (object) {
  object.traverse(child => {
    child.name = 'Public_Space'
  })
  scene.add(object)
})
}

//calling download function
const downloadButton = document.getElementById("downloadButton")
downloadButton.onclick = download

/**
 * Call appserver
 */
async function compute() {
  // construct url for GET /solve/definition.gh?name=value(&...)
  const url = new URL('/solve/' + data.definition, window.location.origin)
  Object.keys(data.inputs).forEach(key => url.searchParams.append(key, data.inputs[key]))
  console.log(url.toString())
  
  try {
    const response = await fetch(url)
  
    if(!response.ok) {
      // TODO: check for errors in response json
      throw new Error(response.statusText)
    }

    const responseJson = await response.json()

    collectResults(responseJson)

  } catch(error) {
    console.error(error)
  }
}

/**
 * Parse response
 */
function collectResults(responseJson) {

    const values = responseJson.values
    // clear doc
    try {
    if( doc !== undefined)
        doc.delete()
   } catch {}

    //console.log(values)
    doc = new rhino.File3dm()

    // for each output (RH_OUT:*)...
    for ( let i = 0; i < values.length; i ++ ) {
      // ...iterate through data tree structure...
      for (const path in values[i].InnerTree) {
        const branch = values[i].InnerTree[path]
        // ...and for each branch...
        for( let j = 0; j < branch.length; j ++) {
          // ...load rhino geometry into doc
          const rhinoObject = decodeItem(branch[j])
          if (rhinoObject !== null) {
            doc.objects().add(rhinoObject, null)
          //GET VALUES
          if (values[i].ParamName == "RH_OUT:area") {
            //area = JSON.parse(responseJson.values[i].InnerTree['{ 0; }'][0].data)
            area = Math.round(branch[j].data)
            console.log('area = ' + area + 'm²')
          }
          // console.log(values[i].ParamName)

        if (rhinoObject !== null) {
          doc.objects().add(rhinoObject, null);
          }
        }
      }
    }

     //GET VALUES
     document.getElementById('area').innerText = "// PANEL AREA = " + area + " m2"

    if (doc.objects().count < 1) {
      console.error('No rhino objects to load!')
      showSpinner(false)
      return
    }

    // load rhino doc into three.js scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse( buffer, function ( object ) 
    {
        // debug 
        /*
        object.traverse(child => {
          if (child.material !== undefined)
            child.material = new THREE.MeshNormalMaterial()
        }, false)
        */

        // clear objects from scene. do this here to avoid blink
        scene.traverse(child => {
          if (
            child.userData.hasOwnProperty("objectType") &&
            child.userData.objectType === "File3dm"
          ) {
            scene.remove(child)
          }
        })

        // color crvs
      object.traverse(child => {
        if (child.isLine) {
          if (child.userData.attributes.geometry.userStringCount > 0) {
            //console.log(child.userData.attributes.geometry.userStrings[0][1])
            const col = child.userData.attributes.geometry.userStrings[0][1]
            const threeColor = new THREE.Color( "rgb(" + col + ")")
            const mat = new THREE.LineBasicMaterial({color:threeColor})
            child.material = mat
          }
        }
      })

        // add object graph from rhino model to three.js scene
        scene.add( object )

        // hide spinner and enable download button
        showSpinner(false)
        downloadButton.disabled = false

        // zoom to extents
        zoomCameraToSelection(camera, controls, scene.children)
    })
}

/**
 * Attempt to decode data tree item to rhino geometry
 */
 function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    // hack for draco meshes
    try {
        return rhino.DracoCompression.decompressBase64String(data)
    } catch {} // ignore errors (maybe the string was just a string...)
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}

/**
 * Called when a slider value changes in the UI. Collect all of the
 * slider values and call compute to solve for a new scene
 */
 function onSliderChange () {
  showSpinner(true)
  // get slider values
  let inputs = {}
  for (const input of document.getElementsByTagName('input')) {
    switch (input.type) {
    case 'number':
      inputs[input.id] = input.valueAsNumber
      break
    case 'range':
      inputs[input.id] = input.valueAsNumber
      break
    case 'checkbox':
      inputs[input.id] = input.checked
      break
    }
  }
  
  data.inputs = inputs

  compute()
}

/**
 * The animation loop!
 */
 function animate() {
  requestAnimationFrame( animate )
  controls.update()
  renderer.render(scene, camera)
}

/**
 * Helper function for window resizes (resets the camera pov and renderer size)
  */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize( window.innerWidth, window.innerHeight )
  animate()
}

/**
 * Helper function that behaves like rhino's "zoom to selection", but for three.js!
 */
 function zoomCameraToSelection( camera, controls, selection, fitOffset = 1.2 ) {
  
  const box = new THREE.Box3();
  
  for( const object of selection ) {
    if (object.isLight) continue
    box.expandByObject( object );
  }
  
  const size = box.getSize( new THREE.Vector3() );
  const center = box.getCenter( new THREE.Vector3() );
  
  const maxSize = Math.max( size.x, size.y, size.z );
  const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * camera.fov / 360 ) );
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance );
  
  const direction = controls.target.clone()
    .sub( camera.position )
    .normalize()
    .multiplyScalar( distance );
  controls.maxDistance = distance * 10;
  controls.target.copy( center );
  
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy( controls.target ).sub(direction);
  
  controls.update();
  
}

/**
 * This function is called when the download button is clicked
 */
 function download () {
  // write rhino doc to "blob"
  const bytes = doc.toByteArray()
  const blob = new Blob([bytes], {type: "application/octect-stream"})

  // use "hidden link" trick to get the browser to download the blob
  const filename = data.definition.replace(/\.gh$/, '') + '.3dm'
  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

/**
* Shows or hides the loading spinner
*/
function showSpinner(enable) {
if (enable)
  document.getElementById('loader').style.display = 'block'
else
  document.getElementById('loader').style.display = 'none'
}