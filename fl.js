let map = L.map("map").setView([15, 103], 10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let svgLayer = L.svg({clickable:true});
svgLayer.addTo(map)

let radius = 15;

d3.json("data.json").then(data => {

  data.nodes.forEach((d, i) => {
    d.latLong = new L.LatLng(d.lat, d.lon);
    d.layerPoint = map.latLngToLayerPoint(d.latLong)
    d.radius = radius
  });

  data.links.forEach((d) => {
    d.source = d.from;
    d.target = d.to;
  });

  // set d3 to use svg layer in leaflet and config it to enable interaction with svg element.
  const svg = d3.select("#map").select("svg").attr("pointer-events", "auto")
  const g = svg.select("g")
  const defs = svg.append("svg:defs");

  const links = g .selectAll("line")
    .data(data.links)
    .join("line")
    .attr("stroke", "red")
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 5)

  
  const nodes = g.selectAll("circle")
    .data(data.nodes)
    .join("circle")
    .attr("id", d => `node-${d.id}`)
    .attr("r", radius)
    .attr("stroke", "red")
    // .attr("fill", "blue")
    .attr("fill", d => {
      let imgSize = d.radius*2
      defs
        .append("svg:pattern")
        .attr("id", `node-img-id${d.id}`)
        .attr("width", imgSize)
        .attr("height", imgSize)
        .append("svg:image")
        .attr("xlink:href", d.img)
        .attr("width", imgSize)
        .attr("height", imgSize)
        .attr("x", 0)
        .attr("y", 0)
      return `url(#node-img-id${d.id})`
    })
    .on("mouseover", function() { 
      d3.select(this).transition() 
        .duration("150")
        .attr("stroke", "blue")
        .attr('r', radius*2)
    })
    .on("mouseout", function() {
      d3.select(this).transition()
        .duration('150')
        .attr("stroke", "red")
        .attr("r", radius)
    })
    .on("click", function() {
      links.attr("stroke", d => {
        return `node-${d.source.id}` == this.id || `node-${d.target.id}` == this.id ? "blue" : "red" 
      })
    })

  const drawAndUpdate = () => {

    links
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y)
  
    nodes
      .each((d) => {
        d.layerPoint = map.latLngToLayerPoint(d.latLong)
        // fix parent node position by set fx and fy, unfix by set it to null
        if (d.type === "parent"){
          d.fx = d.layerPoint.x
          d.fy = d.layerPoint.y
        }
      })
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)

    // simulation.force('x').initialize(nodes.data())
    // simulation.force('y').initialize(nodes.data())
    // simulation.alpha(1).restart();
  }

  
  const simulation = d3.forceSimulation(data.nodes)
  .force('link', d3.forceLink().links(data.links).id(d => d.id))
  // .force('link', d3.forceLink().links(data.links).id(d => d.id).distance(50))
  .force('charge', d3.forceManyBody())
  // .force('charge', d3.forceManyBody().strength(-200))
  .force('collision', d3.forceCollide().radius(d => d.radius*1.5))
  .force('x', d3.forceX().x(d => d.layerPoint.x))
  .force('y', d3.forceY().y(d => d.layerPoint.y))
  // .force('x', d3.forceX().x(d => d.x).strength(0.06))
  // .force('y', d3.forceY().y(d => d.y).strength(0.04))
  .on('tick', () => {
    drawAndUpdate()
  })
  
  // update force center position of all child nodes when the zooming end
  map.on("zoomend", () => {
    simulation.force('x').initialize(nodes.data())
    simulation.force('y').initialize(nodes.data())
    simulation.alpha(1).restart()
  })

})