import {ImageBase, ImageBaseView} from "./image_base"
import {StackColorMapper} from "../mappers/stack_color_mapper"
import type {NDArrayType} from "core/util/ndarray"
import type * as p from "core/properties"
import type {ImageGL} from "./webgl/image"

export interface ImageStackView extends ImageBase.Data {}

export class ImageStackView extends ImageBaseView {
  declare model: ImageStack
  declare visuals: ImageStack.Visuals

  /** @internal */
  declare glglyph?: ImageGL

  override async load_glglyph() {
    const {ImageGL} = await import("./webgl/image")
    return ImageGL
  }

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.color_mapper.change, () => this._update_image())
  }

  override get image_dimension(): number {
    return 3
  }

  protected _update_image(): void {
    if (this.glglyph != null) {
      this.glglyph.set_image_changed()
    }

    // Only reset image_data if already initialized
    if (this.image_data != null) {
      this._set_data(null)
      this.renderer.request_render()
    }
  }

  protected override get _can_inherit_image_data(): boolean {
    return super._can_inherit_image_data &&
      this._can_inherit_from(this.model.properties.color_mapper, this.base)
  }

  protected _flat_img_to_buf8(img: NDArrayType<number>): Uint8ClampedArray {
    const cmap = this.model.color_mapper.rgba_mapper
    return cmap.v_compute(img)
  }
}

export namespace ImageStack {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ImageBase.Props & {
    color_mapper: p.Property<StackColorMapper>
  }

  export type Visuals = ImageBase.Visuals

  export type Data = p.GlyphDataOf<Props>
}

export interface ImageStack extends ImageStack.Attrs {}

export class ImageStack extends ImageBase {
  declare properties: ImageStack.Props
  declare __view_type__: ImageStackView

  constructor(attrs?: Partial<ImageStack.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = ImageStackView

    this.define<ImageStack.Props>(({Ref}) => ({
      color_mapper: [ Ref(StackColorMapper) ],
    }))
  }
}
