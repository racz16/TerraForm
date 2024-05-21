import { Buffer } from './buffer';
import { VertexBufferLayout } from './pipeline';

export interface Mesh {
    name: string;
    vertexBufferDescriptor: VertexBufferDescriptor;
    indexBufferDescriptor: IndexBufferDescriptor;
}

export interface VertexBufferDescriptor {
    buffer: Buffer;
    layout: VertexBufferLayout;
    vertexCount: number;
    index: number;
    offset?: number;
}

export interface IndexBufferDescriptor {
    buffer: Buffer;
    indexCount: number;
}
