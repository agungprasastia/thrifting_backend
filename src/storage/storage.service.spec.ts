import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;

  const mockUpload = jest.fn();
  const mockGetPublicUrl = jest.fn();

  const mockSupabaseClient = {
    storage: {
      from: jest.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('dummy-image-data'),
    size: 1024,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  } as Express.Multer.File;

  beforeEach(async () => {
    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
              if (key === 'SUPABASE_KEY') return 'test-key';
              if (key === 'SUPABASE_BUCKET') return 'thrift-images';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should successfully upload file and return public URL', async () => {
      mockUpload.mockResolvedValue({ data: { path: 'uploads/test.jpg' }, error: null });
      mockGetPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/thrift-images/uploads/test.jpg' },
      });

      const url = await service.uploadFile(mockFile);

      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('test.jpg'),
        mockFile.buffer,
        { contentType: mockFile.mimetype, upsert: true },
      );
      expect(url).toBe('https://test.supabase.co/storage/v1/object/public/thrift-images/uploads/test.jpg');
    });

    it('should throw error if Supabase upload fails', async () => {
      mockUpload.mockResolvedValue({
        data: null,
        error: new Error('Upload error'),
      });

      await expect(service.uploadFile(mockFile)).rejects.toThrow('Upload error');
    });
  });
});
