import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnnotationEditor } from './AnnotationEditor';

const mocks = vi.hoisted(() => ({
    auth: {
        user: { id: 'user-1' },
    },
    store: {
        annotationSnapshot: 'https://example.com/snapshot-a.png',
        annotationAssetId: 'asset-1',
        annotationWorkstationId: 'ws-1',
        annotationExistingData: {
            annotations: [
                {
                    id: 'ann-1',
                    type: 'point',
                    x: 10,
                    y: 20,
                    name: 'Mark1',
                    category: 'mark',
                    description: '',
                },
            ],
            remark: '已有标注',
            recordId: 'record-1',
        },
        exitAnnotationMode: vi.fn(),
    },
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mocks.auth,
}));

vi.mock('@/store/useAppStore', () => ({
    useAppStore: () => mocks.store,
}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn(),
            })),
        },
        from: vi.fn(),
    },
}));

vi.mock('@/utils/annotationRenderer', () => ({
    renderAnnotationsToCanvas: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@/components/product/AnnotationCanvas', () => ({
    AnnotationCanvas: ({
        imageUrl,
        annotations,
    }: {
        imageUrl: string;
        annotations: Array<{ id: string }>;
    }) => (
        <div data-testid="annotation-canvas">
            {imageUrl}|{annotations.length}
        </div>
    ),
}));

describe('AnnotationEditor', () => {
    beforeEach(() => {
        mocks.store.annotationSnapshot = 'https://example.com/snapshot-a.png';
        mocks.store.annotationExistingData = {
            annotations: [
                {
                    id: 'ann-1',
                    type: 'point',
                    x: 10,
                    y: 20,
                    name: 'Mark1',
                    category: 'mark',
                    description: '',
                },
            ],
            remark: '已有标注',
            recordId: 'record-1',
        };
    });

    it('查看历史记录时进入只读模式并加载已有标注', () => {
        render(<AnnotationEditor />);

        expect(screen.getByText('已标注 1 个特征')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '编辑标注' })).toBeInTheDocument();
        expect(screen.getByTestId('annotation-canvas')).toHaveTextContent('snapshot-a.png|1');
    });

    it('切换到新的截图会话时重置只读态与旧标注', () => {
        const { rerender } = render(<AnnotationEditor />);

        mocks.store.annotationSnapshot = 'https://example.com/snapshot-b.png';
        mocks.store.annotationExistingData = null;
        rerender(<AnnotationEditor />);

        expect(screen.getByText('已标注 0 个特征')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: '编辑标注' })).not.toBeInTheDocument();
        expect(screen.getByTestId('annotation-canvas')).toHaveTextContent('snapshot-b.png|0');
    });
});
