import {ClientRect} from '@dnd-kit/core';
import {Transform} from '@dnd-kit/utilities';

export const restrictToBoundingRect = (transform: Transform, rect: ClientRect, boundingRect: ClientRect): Transform => {
    const value = {
        ...transform
    };

    if (rect.top + transform.y <= boundingRect.top) {
        value.y = boundingRect.top - rect.top;
    } else if (rect.bottom + transform.y >= boundingRect.top + boundingRect.height) {
        value.y = boundingRect.top + boundingRect.height - rect.bottom;
    }

    if (rect.left + transform.x <= boundingRect.left) {
        value.x = boundingRect.left - rect.left;
    } else if (rect.right + transform.x >= boundingRect.left + boundingRect.width) {
        value.x = boundingRect.left + boundingRect.width - rect.right;
    }

    return value;
};

export const layoutComponent = (grid: number[][], size: {width: number; height: number}): [number, number] => {
    const {width, height} = size;

    for (let i = 0; i <= grid.length - height; i++) {
        for (let j = 0; j <= grid[i]!.length - width; j++) {
            const canPlace = grid
                .slice(i, i + height)
                .map(row => row.slice(j, j + width))
                .every(row => row.every(item => item === 0));

            // 如果位置可放置，标记为已使用，并终止循环
            if (canPlace) {
                for (let x = 0; x < height; x++) {
                    for (let y = 0; y < width; y++) {
                        grid[i + x]![j + y] = 1;
                    }
                }
                return [i, j];
            }
        }
    }

    return [0, 0];
};
