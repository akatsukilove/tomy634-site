/*
 * Simple physics simulation for floating icons
 * Icons drop from the top of the viewport and bounce when hitting screen edges.
 * Users can drag or flick icons with a mouse or touch. Velocity on release is
 * determined by pointer speed. Gravity constantly pulls icons downward.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);

let bodies = [];
let lastTimestamp = null;
const gravity = 0.4;           // gravitational acceleration (px/frame^2)
const bounceFactor = 0.6;       // energy retention on bounce
const friction = 0.98;          // horizontal friction on bounce

function init() {
  const icons = Array.from(document.querySelectorAll('.icon'));
  icons.forEach(icon => {
    // Create a body for each icon
    const rect = { width: 80, height: 80 };
    // Start above the viewport with random x
    const startX = Math.random() * (window.innerWidth - rect.width);
    const startY = -Math.random() * 200 - rect.height;
    icon.style.transform = `translate(${startX}px, ${startY}px)`;
    const body = {
      el: icon,
      x: startX,
      y: startY,
      vx: (Math.random() - 0.5) * 1.0,
      vy: 0,
      width: rect.width,
      height: rect.height,
      dragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      lastPointerPos: { x: 0, y: 0 },
      vxPointer: 0,
      vyPointer: 0
    };
    bodies.push(body);

    // Attach event listeners for dragging
    icon.addEventListener('mousedown', e => startDrag(e, body));
    icon.addEventListener('touchstart', e => startDrag(e, body), { passive: false });
  });
  // Start the animation loop
  requestAnimationFrame(step);
}

function getPointerPos(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
}

function startDrag(e, body) {
  e.preventDefault();
  body.dragging = true;
  const pos = getPointerPos(e);
  body.dragOffsetX = pos.x - body.x;
  body.dragOffsetY = pos.y - body.y;
  body.vx = 0;
  body.vy = 0;
  body.vxPointer = 0;
  body.vyPointer = 0;
  body.lastPointerPos = pos;
  // Attach global handlers for move and end
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('touchmove', doDrag, { passive: false });
  document.addEventListener('mouseup', endDrag);
  document.addEventListener('touchend', endDrag);
  // Store active body globally for reference in handlers
  activeBody = body;
}

// Keep track of currently dragged body
let activeBody = null;

function doDrag(e) {
  if (!activeBody) return;
  const body = activeBody;
  const pos = getPointerPos(e);
  if (body.dragging) {
    e.preventDefault();
    // Update position based on pointer minus offset
    body.x = pos.x - body.dragOffsetX;
    body.y = pos.y - body.dragOffsetY;
    // Compute velocity based on pointer movement since last move
    body.vxPointer = pos.x - body.lastPointerPos.x;
    body.vyPointer = pos.y - body.lastPointerPos.y;
    body.lastPointerPos = pos;
  }
}

function endDrag(e) {
  if (!activeBody) return;
  const body = activeBody;
  if (body.dragging) {
    body.dragging = false;
    // Set initial velocity based on pointer movement
    body.vx = body.vxPointer;
    body.vy = body.vyPointer;
    activeBody = null;
    // Remove global handlers
    document.removeEventListener('mousemove', doDrag);
    document.removeEventListener('touchmove', doDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
  }
}

function step(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 16.7; // Normalized to 60fps
  lastTimestamp = timestamp;
  const maxX = window.innerWidth;
  const maxY = window.innerHeight;
  bodies.forEach(body => {
    if (!body.dragging) {
      // Apply gravity
      body.vy += gravity * dt;
      // Update positions
      body.x += body.vx * dt;
      body.y += body.vy * dt;
      // Left and right collision
      if (body.x < 0) {
        body.x = 0;
        body.vx = -body.vx * bounceFactor;
      } else if (body.x + body.width > maxX) {
        body.x = maxX - body.width;
        body.vx = -body.vx * bounceFactor;
      }
      // Top collision
      if (body.y < 0) {
        body.y = 0;
        body.vy = -body.vy * bounceFactor;
      }
      // Bottom collision
      if (body.y + body.height > maxY) {
        body.y = maxY - body.height;
        body.vy = -body.vy * bounceFactor;
        body.vx *= friction;
      }
    }
    // Apply transform
    body.el.style.transform = `translate(${body.x}px, ${body.y}px)`;
  });
  requestAnimationFrame(step);
}
