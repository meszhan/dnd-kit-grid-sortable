# 基于@dnd-kit/sortable实现的网格布局拖拽排序

### 需求背景

现在我们有一个n * n（n表示一个网格单元，不是宽高像素） 的网格布局，里面有若干个大小a * b（0 < a,b <= n）不等的小方块，小方块的排列满足从上到下、从左到右的优先级顺序排列，我们需要通过移动小方块来调整它们的位置。

比如小方块的顺序是1、2、3、4、5、6，如果移动方块5与方块2产生了碰撞，那么此时顺序应该变为1、5、2、3、4、6，也就是说拖拽产生的应该是插入正在拖拽的方块，而非交换。



### @dnd-kit/sortable介绍

`@dnd-kit/sortable`是`dnd-kit` 官方提供的一个用于构建可排序的块的预设库。注意这里并没有严格规定这些块的布局方式，所以它是完全开放的，支持开发者去自定义实现排序策略。



### 排序策略

[`@dnd-kit/sortable`](https://docs.dndkit.com/presets/sortable)  支持垂直列表、水平列表、网格和虚拟列表等排序用例。它暴露了许多不同的策略供开发者选择：

+ `rectSortingStrategy` ：默认使用的策略，适用于大多数用例，不支持虚拟列表
+ `verticalListSortingStrategy`：此策略针对垂直列表进行了优化，并支持虚拟列表
+ `horizontalListSortingStrategy`：此策略针对水平列表进行了优化，并支持虚拟列表
+ `rectSwappingStrategy`：使用此策略实现交换功能

因为我们需要满足自己的排序规则，所以上面的策略都无法使用，这个时候我们就需要实现自定义排序策略了。

上面的排序策略中，功能和我们最相近的是`rectSortingStrategy`策略，它会在方块之间产生碰撞后重新排序，但它的排序规则会和我们上面提到的优先级排序规则产生冲突，所以我们要做的就是修改它的排序规则。

我们先来看看`rectSortingStrategy`的实现：

```typescript
/**
 * Move an array item to a different position. Returns a new array with the item moved to the new position.
 */
export function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  newArray.splice(
    to < 0 ? newArray.length + to : to,
    0,
    newArray.splice(from, 1)[0]
  );

  return newArray;
}

export const rectSortingStrategy: SortingStrategy = ({
  rects,
  activeIndex,
  overIndex,
  index,
}) => {
  const newRects = arrayMove(rects, overIndex, activeIndex);

  const oldRect = rects[index];
  const newRect = newRects[index];

  if (!newRect || !oldRect) {
    return null;
  }

  return {
    x: newRect.left - oldRect.left,
    y: newRect.top - oldRect.top,
    scaleX: newRect.width / oldRect.width,
    scaleY: newRect.height / oldRect.height,
  };
};
```

方块顺序的调整发生在`arrayMove` 这一步，`activeIndex` 表示当前正在拖拽的元素的下标，`overIndex` 表示当前产生碰撞的元素下标，`arrayMove` 会将`activeIndex` 上的数组项插入到`overIndex` 前来实现调整顺序

在调整完顺序后再计算`x`和`y` 分别表示元素在`X`轴和`Y`轴上的偏移量，它们会被传递给[`useSortable`](https://docs.dndkit.com/presets/sortable/usesortable) 作用于除拖拽中元素外的其他元素的`transform` 属性上，来实现视觉上的位置交换（实际位置未发生变化）。



### 自定义排序策略

在实现自定义的排序策略之前，先定义下网格布局中方块的接口

```typescript
export  interface ComponentType {
    /** 组件id */
    componentId: string;
    /** 行数 */
    rowSpan: number;
    /** 列数 */
    colSpan: number;
    /** 网格中的x行 */
    x: number;
    /** 网格中的y列 */
    y: number;
}
```

+ `componentId` ：在拖拽中用于标识拖拽项
+ `rowSpan/colSpan` ：组件所占据的行数和列数
+ `x/y` ：组件在网格布局中的位置，表示组件左上角在`x` 行`y` 列位置

假设方块的数量为`n` ，我们先定义一个`2n * 8` 的网格数组表示有`2n`行、8列并填充为0，此时整个网格布局中不存在内容，接下来：

1. 将方块依次按照上述规则排列进网格中得到新的方块顺序
2. 根据方块的偏移量、大小和间距计算与原位置的偏移量（x、y）

```typescript
const sortableStrategy: SortingStrategy = ({activeIndex, overIndex, index}) => {
        const grid = new Array(components.length * 2).fill(1).map(() => new Array(8).fill(0));
        const newComponents = arrayMove(components.slice(), activeIndex, overIndex).map(component => {
            const [x, y] = layoutComponent(grid, {
                width: component.colSpan,
                height: component.rowSpan
            });

            return {...component, x, y};
        });

        const oldComponent = components[index]!;
        const newComponent = newComponents.find(component => component.componentId === oldComponent.componentId)!;

        return {
            y: (newComponent.x - oldComponent.x) * (COMPONENT_SIZE + COMPONENT_GAP),
            x: (newComponent.y - oldComponent.y) * (COMPONENT_SIZE + COMPONENT_GAP),
            scaleX: 1,
            scaleY: 1
        };
    };
```

