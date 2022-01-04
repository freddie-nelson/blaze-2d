import { vec2 } from "gl-matrix";
import Blaze from "../../blaze";
import BatchRenderer from "../../renderer/batchRenderer";
import Renderer from "../../renderer/renderer";
import BlazeDropdown from "../../ui/dropdown";
import BlazeHeading from "../../ui/heading";
import BlazeInput from "../../ui/input";
import BlazeStat from "../../ui/stat";
import { TextStyle } from "../../ui/text";
import EditorPane from "./pane";

export default class RendererPane extends EditorPane {
  // headings
  rendererHeading = new BlazeHeading("Renderer", 1, 1.5);
  instanceHeading = new BlazeHeading("Instance Renderer", 1, 1.5);
  batchHeading = new BlazeHeading("Batch Renderer", 1, 1.5);

  // inputs
  drawMode = new BlazeDropdown("TRIANGLES", ["TRIANGLES", "LINES", "POINTS"], 1);
  resolutionScale = new BlazeInput("resolutionScale", "Enter a positive number...", 1);

  // stats
  fps = new BlazeStat("FPS", 0, 1, false, TextStyle.HIGHLIGHT);

  instanceRenderTime = new BlazeStat("Render Time", 0, 1, false, TextStyle.SECONDARY);
  instanceDrawCalls = new BlazeStat("Draw calls", 0, 1, false, TextStyle.SECONDARY);
  instanceRects = new BlazeStat("Rects Drawn", 0, 1, false, TextStyle.SECONDARY);
  instanceCircles = new BlazeStat("Circles Drawn", 0, 1, false, TextStyle.SECONDARY);
  instanceTris = new BlazeStat("Triangles Drawn", 0, 1, false, TextStyle.SECONDARY);

  batchRenderTime = new BlazeStat("Render Time", 0, 1, false, TextStyle.SECONDARY);
  batchDrawCalls = new BlazeStat("Draw calls", 0, 1, false, TextStyle.SECONDARY);
  batchRects = new BlazeStat("Rects Drawn", 0, 1, false, TextStyle.SECONDARY);
  batchCircles = new BlazeStat("Circles Drawn", 0, 1, false, TextStyle.SECONDARY);
  batchTris = new BlazeStat("Triangles Drawn", 0, 1, false, TextStyle.SECONDARY);

  /**
   * Creates a {@link RendererPane}.
   *
   * @param pos The top left corner of the pane in the editor grid
   * @param width The width of the pane in columns
   * @param height The height of the pane in rows
   */
  constructor(pos?: vec2, width?: number, height?: number) {
    super("renderer", pos, width, height);

    this.element.style.padding = "0.8rem";

    this.drawMode.addLabel("Drawing Mode:");
    this.drawMode.setSelected(Renderer.getMode());
    this.drawMode.onSelect = (selected) => Renderer.setMode(<any>selected);

    this.resolutionScale.addLabel("Resolution Scale:");
    this.resolutionScale.setValue(String(Renderer.getResolutionScale()));
    this.resolutionScale.onInput = (value) => {
      const num = Number(value);
      if (!isNaN(num) && num > 0) Renderer.setResolutionScale(num);
    };

    this.element.appendChild(this.rendererHeading.element);
    this.element.appendChild(this.fps.element);
    this.element.appendChild(this.drawMode.element);
    this.element.appendChild(this.resolutionScale.element);

    this.instanceHeading.element.style.marginTop = "1.6ch";
    this.batchHeading.element.style.marginTop = "1.6ch";

    this.element.appendChild(this.instanceHeading.element);
    this.element.appendChild(this.instanceRenderTime.element);
    this.element.appendChild(this.instanceDrawCalls.element);
    this.element.appendChild(this.instanceRects.element);
    this.element.appendChild(this.instanceCircles.element);
    this.element.appendChild(this.instanceTris.element);

    this.element.appendChild(this.batchHeading.element);
    this.element.appendChild(this.batchRenderTime.element);
    this.element.appendChild(this.batchDrawCalls.element);
    this.element.appendChild(this.batchRects.element);
    this.element.appendChild(this.batchCircles.element);
    this.element.appendChild(this.batchTris.element);
  }

  /**
   * Update render stats.
   */
  update() {
    this.fps.setValue(Number((1 / Blaze.getTimeStep().dt).toFixed(1)));
  }
}
