import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

interface UploadRequest {
  serviceName: string;
  photos: string[]; // Array de base64
}

export async function POST(request: NextRequest) {
  try {
    const { serviceName, photos }: UploadRequest = await request.json();

    if (!serviceName || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Nome do serviço e fotos são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar autenticação com Service Account
    let auth;

    // Opção 1: Usar GOOGLE_SERVICE_ACCOUNT_JSON (JSON completo codificado em base64)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const jsonString = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
        const credentials = JSON.parse(jsonString);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } catch (e) {
        console.error('Erro ao parsear GOOGLE_SERVICE_ACCOUNT_JSON:', e);
        throw new Error('Credenciais JSON inválidas');
      }
    }
    // Opção 2: Usar variáveis separadas
    else {
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

      // Se a chave contém \n literal (como string), converter para quebra de linha real
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Remover aspas extras que podem vir da variável de ambiente
      privateKey = privateKey.replace(/^["']|["']$/g, '');

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    // Passo A: Criar pasta com nome do serviço
    const folderMetadata = {
      name: serviceName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.PARENT_FOLDER_ID as string],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
    });

    const folderId = folder.data.id;

    if (!folderId) {
      throw new Error('Falha ao criar pasta no Google Drive');
    }

    // Passo B: Upload de todas as fotos para a pasta criada
    const uploadResults = [];

    for (let i = 0; i < photos.length; i++) {
      const base64Data = photos[i];
      // Remove o prefixo data:image/xxx;base64, se existir
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Content, 'base64');

      const fileName = `foto_${i + 1}_${Date.now()}.jpg`;

      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: 'image/jpeg',
        body: Readable.from(buffer),
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name',
      });

      uploadResults.push({
        fileName: file.data.name,
        fileId: file.data.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${photos.length} foto(s) enviada(s) com sucesso`,
      folder: {
        id: folderId,
        name: serviceName,
      },
      files: uploadResults,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);

    let errorMessage = 'Erro ao fazer upload das fotos';
    let details = String(error);

    if (error?.message) {
      details = error.message;
    }

    if (error?.response?.data?.error) {
      const driveError = error.response.data.error;
      details = `${driveError.message} (${driveError.status})`;

      if (driveError.status === 'PERMISSION_DENIED') {
        errorMessage = 'Sem permissão. Verifique se a pasta foi compartilhada com a Service Account.';
      } else if (driveError.status === 'NOT_FOUND') {
        errorMessage = 'Pasta não encontrada. Verifique o PARENT_FOLDER_ID.';
      }
    }

    return NextResponse.json(
      { error: errorMessage, details },
      { status: 500 }
    );
  }
}
